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

    async generateCompletion(
        prompt: string,
        onStream?: (chunk: string) => void
    ): Promise<string> {
        const model = this.config.get<string>('model', 'deepseek-coder:6.7b');
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
        messages: { role: string; content: string }[],
        onStream?: (chunk: string) => void
    ): Promise<string> {
        // Ollama의 chat API 사용
        const model = this.config.get<string>('model', 'deepseek-coder:6.7b');
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
