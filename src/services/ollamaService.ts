import axios, { AxiosInstance } from 'axios';
import * as vscode from 'vscode';

export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    options?: {
        temperature?: number;
        top_p?: number;
        top_k?: number;
        num_predict?: number;
    };
}

export interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
}

export class OllamaService {
    private client: AxiosInstance;
    private config: vscode.WorkspaceConfiguration;
    private cachedModel: string | null = null;
    private modelCacheTime: number = 0;
    private readonly MODEL_CACHE_DURATION = 30000; // 30초 캐시

    constructor() {
        this.config = vscode.workspace.getConfiguration('opencopilot');
        const baseURL = this.config.get<string>('ollamaUrl', 'http://localhost:11434');
        
        this.client = axios.create({
            baseURL,
            timeout: 60000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // 설정 변경 감지
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('opencopilot.ollamaUrl')) {
                this.config = vscode.workspace.getConfiguration('opencopilot');
                const newURL = this.config.get<string>('ollamaUrl', 'http://localhost:11434');
                this.client.defaults.baseURL = newURL;
            }
            if (e.affectsConfiguration('opencopilot.modelMode') || 
                e.affectsConfiguration('opencopilot.model')) {
                // 모델 관련 설정 변경 시 캐시 초기화
                this.cachedModel = null;
                this.modelCacheTime = 0;
                console.log('[손종욱 AI 비서] 모델 설정이 변경되었습니다.');
            }
        });
    }

    async testConnection(): Promise<boolean> {
        try {
            const response = await this.client.get('/api/tags');
            return response.status === 200;
        } catch (error) {
            console.error('Ollama connection test failed:', error);
            return false;
        }
    }

    /**
     * 사용할 모델을 가져옵니다.
     * modelMode가 'auto'인 경우 사용 가능한 모델을 자동으로 선택합니다.
     * modelMode가 'manual'인 경우 설정된 모델을 반환합니다.
     */
    async getModel(): Promise<string> {
        const modelMode = this.config.get<string>('modelMode', 'auto');
        
        if (modelMode === 'manual') {
            // 수동 모드: 설정된 모델 반환
            const manualModel = this.config.get<string>('model', 'qwen2.5-coder:32b');
            console.log(`[손종욱 AI 비서] 수동 모드: ${manualModel} 모델 사용`);
            return manualModel;
        }

        // Auto 모드: 캐시 확인
        const now = Date.now();
        if (this.cachedModel && (now - this.modelCacheTime) < this.MODEL_CACHE_DURATION) {
            return this.cachedModel;
        }

        // 사용 가능한 모델 자동 선택
        try {
            const availableModels = await this.listModels();
            
            if (availableModels.length === 0) {
                console.warn('[손종욱 AI 비서] 사용 가능한 모델이 없습니다. 기본 모델 사용');
                const defaultModel = this.config.get<string>('model', 'qwen2.5-coder:32b');
                this.cachedModel = defaultModel;
                this.modelCacheTime = now;
                return defaultModel;
            }

            // 모델 우선순위
            // 1) 고성능 코딩 모델 우선
            // 2) 없으면 경량 로컬 fallback 사용
            const modelPriorities = [
                /^qwen2\.5-coder:32b/i,
                /^qwen2\.5-coder:14b/i,
                /^qwen2\.5-coder:7b/i,
                /^deepseek-coder-v2/i,
                /^deepseek-coder:33b/i,
                /^glm4/i,
                /^codestral/i,
                /^codellama/i,
                /^qwen2\.5-coder:3b/i,
                /^qwen2\.5-coder:1\.5b/i,
                /^deepseek-coder:1\.3b/i,
                /^phi3:mini/i,
                /^qwen2\.5-coder/i,
                /^deepseek-coder/i,
                /^qwen/i,
                /^llama3/i,
                /^llama/i,
            ];

            // 우선순위에 따라 모델 선택
            for (const priority of modelPriorities) {
                const matchedModel = availableModels.find(m => priority.test(m));
                if (matchedModel) {
                    console.log(`[손종욱 AI 비서] Auto 모드: ${matchedModel} 모델 자동 선택`);
                    this.cachedModel = matchedModel;
                    this.modelCacheTime = now;
                    return matchedModel;
                }
            }

            // 우선순위에 없으면 첫 번째 모델 사용
            const selectedModel = availableModels[0];
            console.log(`[손종욱 AI 비서] Auto 모드: ${selectedModel} 모델 자동 선택 (기본)`);
            this.cachedModel = selectedModel;
            this.modelCacheTime = now;
            return selectedModel;

        } catch (error) {
            console.error('[손종욱 AI 비서] 모델 자동 선택 실패:', error);
            const defaultModel = this.config.get<string>('model', 'qwen2.5-coder:32b');
            return defaultModel;
        }
    }

    async generateCompletion(
        prompt: string,
        onStream?: (chunk: string) => void
    ): Promise<string> {
        const model = await this.getModel();
        const temperature = this.config.get<number>('temperature', 0.2);
        const maxTokens = this.config.get<number>('maxTokens', 2000);

        const request: OllamaGenerateRequest = {
            model,
            prompt,
            stream: !!onStream,
            options: {
                temperature,
                num_predict: maxTokens,
            },
        };

        try {
            if (onStream) {
                return await this.generateStreamCompletion(request, onStream);
            } else {
                return await this.generateNonStreamCompletion(request);
            }
        } catch (error: any) {
            console.error('Ollama generation failed:', error);
            if (error.response?.status === 404) {
                throw new Error(`모델을 찾을 수 없습니다: ${model}. Ollama에서 'ollama pull ${model}' 명령으로 모델을 다운로드하세요.`);
            }
            throw new Error(`AI 생성 실패: ${error.message}`);
        }
    }

    private async generateNonStreamCompletion(request: OllamaGenerateRequest): Promise<string> {
        const response = await this.client.post<OllamaGenerateResponse>(
            '/api/generate',
            { ...request, stream: false }
        );
        return response.data.response;
    }

    private async generateStreamCompletion(
        request: OllamaGenerateRequest,
        onStream: (chunk: string) => void
    ): Promise<string> {
        const response = await this.client.post('/api/generate', request, {
            responseType: 'stream',
        });

        let fullResponse = '';

        return new Promise((resolve, reject) => {
            response.data.on('data', (chunk: Buffer) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const json: OllamaGenerateResponse = JSON.parse(line);
                        if (json.response) {
                            fullResponse += json.response;
                            onStream(json.response);
                        }
                        if (json.done) {
                            resolve(fullResponse);
                        }
                    } catch (error) {
                        console.error('Failed to parse stream chunk:', error);
                    }
                }
            });

            response.data.on('error', (error: Error) => {
                reject(error);
            });

            response.data.on('end', () => {
                if (fullResponse) {
                    resolve(fullResponse);
                } else {
                    reject(new Error('No response received'));
                }
            });
        });
    }

    async getChatCompletion(
        messages: { role: string; content: string; images?: string[] }[],
        onStream?: (chunk: string) => void
    ): Promise<string> {
        // Ollama의 chat API 사용
        const model = await this.getModel();
        const temperature = this.config.get<number>('temperature', 0.2);

        try {
            const response = await this.client.post('/api/chat', {
                model,
                messages,
                stream: !!onStream,
                options: {
                    temperature,
                },
            }, {
                responseType: onStream ? 'stream' : 'json',
            });

            if (onStream) {
                let fullResponse = '';
                
                return new Promise((resolve, reject) => {
                    response.data.on('data', (chunk: Buffer) => {
                        const lines = chunk.toString().split('\n').filter(line => line.trim());
                        
                        for (const line of lines) {
                            try {
                                const json = JSON.parse(line);
                                if (json.message?.content) {
                                    fullResponse += json.message.content;
                                    onStream(json.message.content);
                                }
                                if (json.done) {
                                    resolve(fullResponse);
                                }
                            } catch (error) {
                                console.error('Failed to parse stream chunk:', error);
                            }
                        }
                    });

                    response.data.on('error', reject);
                    response.data.on('end', () => resolve(fullResponse));
                });
            } else {
                return response.data.message.content;
            }
        } catch (error: any) {
            console.error('Chat completion failed:', error);
            throw new Error(`채팅 생성 실패: ${error.message}`);
        }
    }

    async listModels(): Promise<string[]> {
        try {
            const response = await this.client.get('/api/tags');
            return response.data.models?.map((m: any) => m.name) || [];
        } catch (error) {
            console.error('Failed to list models:', error);
            return [];
        }
    }
}
