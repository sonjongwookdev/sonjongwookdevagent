import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';

export class InlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private lastCompletionTime = 0;
    private completionDelay = 300;

    constructor(private ollamaService: OllamaService) {
        // 설정에서 지연 시간 가져오기
        const config = vscode.workspace.getConfiguration('opencopilot');
        this.completionDelay = config.get<number>('completionDelay', 300);

        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('opencopilot.completionDelay')) {
                const config = vscode.workspace.getConfiguration('opencopilot');
                this.completionDelay = config.get<number>('completionDelay', 300);
            }
        });
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | vscode.InlineCompletionList | undefined> {
        // 너무 자주 호출되지 않도록 제한
        const now = Date.now();
        if (now - this.lastCompletionTime < this.completionDelay) {
            return undefined;
        }

        // 설정 확인
        const config = vscode.workspace.getConfiguration('opencopilot');
        if (!config.get<boolean>('enableInlineCompletion')) {
            return undefined;
        }

        // 컨텍스트 트리거 확인
        if (context.triggerKind === vscode.InlineCompletionTriggerKind.Automatic) {
            // 현재 줄이 비어있거나 공백만 있으면 스킵
            const line = document.lineAt(position.line);
            const textBeforeCursor = line.text.substring(0, position.character);
            if (textBeforeCursor.trim().length === 0) {
                return undefined;
            }
        }

        this.lastCompletionTime = now;

        try {
            const completion = await this.generateCompletion(document, position, token);
            if (!completion || token.isCancellationRequested) {
                return undefined;
            }

            return [
                new vscode.InlineCompletionItem(
                    completion,
                    new vscode.Range(position, position)
                )
            ];
        } catch (error) {
            console.error('Inline completion failed:', error);
            return undefined;
        }
    }

    private async generateCompletion(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<string | undefined> {
        // 컨텍스트 수집
        const context = this.getContext(document, position);
        
        // 프롬프트 생성
        const prompt = this.buildPrompt(document, context);

        try {
            // 타임아웃을 짧게 설정 (5초)
            const timeoutPromise = new Promise<undefined>((resolve) => {
                setTimeout(() => resolve(undefined), 5000);
            });

            const completionPromise = this.ollamaService.generateCompletion(prompt);

            const result = await Promise.race([completionPromise, timeoutPromise]);

            if (!result || token.isCancellationRequested) {
                return undefined;
            }

            // 결과 정리
            return this.cleanCompletion(result, context.currentLine);
        } catch (error) {
            console.error('Completion generation error:', error);
            return undefined;
        }
    }

    private getContext(document: vscode.TextDocument, position: vscode.Position) {
        const line = document.lineAt(position.line);
        const currentLine = line.text.substring(0, position.character);
        
        // 이전 몇 줄 가져오기
        const startLine = Math.max(0, position.line - 20);
        const beforeRange = new vscode.Range(startLine, 0, position.line, position.character);
        const beforeText = document.getText(beforeRange);

        // 다음 몇 줄 가져오기 (컨텍스트용)
        const endLine = Math.min(document.lineCount - 1, position.line + 5);
        const afterRange = new vscode.Range(position.line, position.character, endLine, 0);
        const afterText = document.getText(afterRange);

        return {
            currentLine,
            beforeText,
            afterText,
            language: document.languageId,
        };
    }

    private buildPrompt(document: vscode.TextDocument, context: any): string {
        const language = context.language;
        
        let prompt = `You are an AI code completion assistant. Complete the following ${language} code naturally and concisely.

Only provide the completion text that should be inserted at the cursor position. Do not repeat the existing code. Do not include explanations.

Existing code:
\`\`\`${language}
${context.beforeText}`;

        if (context.afterText.trim()) {
            prompt += `\n[CURSOR]\n${context.afterText}\n\`\`\`\n\nComplete at [CURSOR]:`;
        } else {
            prompt += `\n\`\`\`\n\nContinue the code:`;
        }

        return prompt;
    }

    private cleanCompletion(completion: string, currentLine: string): string {
        // 코드 블록 마커 제거
        completion = completion.replace(/```[\w]*\n?/g, '');
        completion = completion.trim();

        // 현재 줄의 중복 제거
        const lines = completion.split('\n');
        if (lines.length > 0 && currentLine.trim()) {
            const firstLine = lines[0].trim();
            const currentTrimmed = currentLine.trim();
            
            // 첫 줄이 현재 줄과 중복되면 제거
            if (firstLine.startsWith(currentTrimmed)) {
                lines[0] = firstLine.substring(currentTrimmed.length);
            }
        }

        // 최대 10줄로 제한
        const limitedLines = lines.slice(0, 10);
        
        return limitedLines.join('\n');
    }
}
