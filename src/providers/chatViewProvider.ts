import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messages: Message[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly ollamaService: OllamaService
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        // 웹뷰 메시지 처리
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'sendMessage':
                    await this.handleUserMessage(data.message);
                    break;
                case 'clearChat':
                    this.messages = [];
                    this._view?.webview.postMessage({ type: 'clearChat' });
                    break;
                case 'insertCode':
                    await this.insertCodeToEditor(data.code);
                    break;
                case 'copyCode':
                    await vscode.env.clipboard.writeText(data.code);
                    vscode.window.showInformationMessage('코드가 클립보드에 복사되었습니다.');
                    break;
            }
        });
    }

    public async sendMessage(message: string) {
        await this.handleUserMessage(message);
    }

    private async handleUserMessage(userMessage: string) {
        if (!this._view) {
            return;
        }

        // 사용자 메시지 추가
        this.messages.push({ role: 'user', content: userMessage });
        this._view.webview.postMessage({
            type: 'addMessage',
            message: { role: 'user', content: userMessage },
        });

        // 어시스턴트 응답 시작
        this._view.webview.postMessage({ type: 'startStreaming' });

        try {
            // 컨텍스트 수집
            const context = await this.getContext();
            const systemMessage: Message = {
                role: 'system',
                content: `당신은 전문 프로그래밍 어시스턴트입니다. 코드 작성, 디버깅, 리팩토링, 문서화를 도와줍니다.\n\n현재 작업 컨텍스트:\n${context}`,
            };

            // AI 응답 생성
            const response = await this.ollamaService.getChatCompletion(
                [systemMessage, ...this.messages],
                (chunk) => {
                    // 스트리밍 응답
                    this._view?.webview.postMessage({
                        type: 'streamChunk',
                        chunk,
                    });
                }
            );

            // 응답 완료
            this.messages.push({ role: 'assistant', content: response });
            this._view.webview.postMessage({ type: 'endStreaming' });
        } catch (error: any) {
            this._view.webview.postMessage({
                type: 'error',
                message: error.message || '오류가 발생했습니다.',
            });
        }
    }

    private async getContext(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '현재 열린 파일이 없습니다.';
        }

        const document = editor.document;
        const selection = editor.selection;
        
        let context = `파일: ${document.fileName}\n`;
        context += `언어: ${document.languageId}\n`;
        
        if (!selection.isEmpty) {
            const selectedText = document.getText(selection);
            context += `\n선택된 코드:\n\`\`\`${document.languageId}\n${selectedText}\n\`\`\`\n`;
        }

        // 현재 파일의 에러 정보
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        if (diagnostics.length > 0) {
            context += `\n현재 진단 문제:\n`;
            diagnostics.slice(0, 5).forEach(d => {
                context += `- 줄 ${d.range.start.line + 1}: ${d.message}\n`;
            });
        }

        return context;
    }

    private async insertCodeToEditor(code: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('열린 에디터가 없습니다.');
            return;
        }

        await editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, code);
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Open Copilot Chat</title>
            <style>
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background-color: var(--vscode-editor-background);
                    padding: 10px;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                }

                #chat-container {
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 10px;
                    padding: 10px;
                }

                .message {
                    margin-bottom: 15px;
                    padding: 10px;
                    border-radius: 5px;
                }

                .message.user {
                    background-color: var(--vscode-input-background);
                    border-left: 3px solid var(--vscode-button-background);
                }

                .message.assistant {
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-left: 3px solid var(--vscode-textLink-foreground);
                }

                .message-role {
                    font-weight: bold;
                    margin-bottom: 5px;
                    font-size: 0.9em;
                    opacity: 0.8;
                }

                .message-content {
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }

                .message-content code {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: var(--vscode-editor-font-family);
                }

                .message-content pre {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 10px;
                    border-radius: 5px;
                    overflow-x: auto;
                    position: relative;
                    margin: 10px 0;
                }

                .message-content pre code {
                    background: none;
                    padding: 0;
                }

                .code-actions {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    display: flex;
                    gap: 5px;
                }

                .code-actions button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 4px 8px;
                    cursor: pointer;
                    border-radius: 3px;
                    font-size: 0.8em;
                }

                .code-actions button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                #input-container {
                    display: flex;
                    gap: 10px;
                    padding: 10px 0;
                    border-top: 1px solid var(--vscode-panel-border);
                }

                #message-input {
                    flex: 1;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 8px;
                    border-radius: 3px;
                    font-family: var(--vscode-font-family);
                    resize: vertical;
                    min-height: 60px;
                }

                #message-input:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }

                .button-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    cursor: pointer;
                    border-radius: 3px;
                    white-space: nowrap;
                }

                button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }

                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .streaming {
                    opacity: 0.7;
                }

                .streaming::after {
                    content: '▌';
                    animation: blink 1s infinite;
                }

                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }

                .error {
                    color: var(--vscode-errorForeground);
                    background-color: var(--vscode-inputValidation-errorBackground);
                    border: 1px solid var(--vscode-inputValidation-errorBorder);
                    padding: 10px;
                    border-radius: 5px;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div id="chat-container"></div>
            <div id="input-container">
                <textarea id="message-input" placeholder="질문을 입력하세요... (Ctrl+Enter로 전송)"></textarea>
                <div class="button-group">
                    <button id="send-button">전송</button>
                    <button id="clear-button">초기화</button>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const chatContainer = document.getElementById('chat-container');
                const messageInput = document.getElementById('message-input');
                const sendButton = document.getElementById('send-button');
                const clearButton = document.getElementById('clear-button');

                let isStreaming = false;
                let currentStreamingMessage = null;

                sendButton.addEventListener('click', sendMessage);
                clearButton.addEventListener('click', clearChat);

                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                function sendMessage() {
                    const message = messageInput.value.trim();
                    if (!message || isStreaming) return;

                    vscode.postMessage({
                        type: 'sendMessage',
                        message: message
                    });

                    messageInput.value = '';
                    messageInput.focus();
                }

                function clearChat() {
                    if (confirm('채팅 기록을 모두 삭제하시겠습니까?')) {
                        vscode.postMessage({ type: 'clearChat' });
                    }
                }

                function addMessage(role, content) {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = \`message \${role}\`;

                    const roleDiv = document.createElement('div');
                    roleDiv.className = 'message-role';
                    roleDiv.textContent = role === 'user' ? '사용자' : 'AI 어시스턴트';

                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'message-content';
                    contentDiv.innerHTML = formatMessage(content);

                    messageDiv.appendChild(roleDiv);
                    messageDiv.appendChild(contentDiv);
                    chatContainer.appendChild(messageDiv);

                    // 코드 블록에 액션 버튼 추가
                    addCodeActions(messageDiv);

                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    return messageDiv;
                }

                function formatMessage(content) {
                    // 코드 블록 처리
                    content = content.replace(/\`\`\`(\w+)?\n?([\s\S]*?)\`\`\`/g, (match, lang, code) => {
                        return \`<pre><code class="language-\${lang || 'plaintext'}">\${escapeHtml(code.trim())}</code></pre>\`;
                    });

                    // 인라인 코드 처리
                    content = content.replace(/\`([^\`]+)\`/g, '<code>$1</code>');

                    // 줄바꿈 처리
                    content = content.replace(/\n/g, '<br>');

                    return content;
                }

                function escapeHtml(text) {
                    const div = document.createElement('div');
                    div.textContent = text;
                    return div.innerHTML;
                }

                function addCodeActions(messageDiv) {
                    const codeBlocks = messageDiv.querySelectorAll('pre code');
                    codeBlocks.forEach(codeBlock => {
                        const pre = codeBlock.parentElement;
                        const actionsDiv = document.createElement('div');
                        actionsDiv.className = 'code-actions';

                        const insertBtn = document.createElement('button');
                        insertBtn.textContent = '삽입';
                        insertBtn.onclick = () => {
                            vscode.postMessage({
                                type: 'insertCode',
                                code: codeBlock.textContent
                            });
                        };

                        const copyBtn = document.createElement('button');
                        copyBtn.textContent = '복사';
                        copyBtn.onclick = () => {
                            vscode.postMessage({
                                type: 'copyCode',
                                code: codeBlock.textContent
                            });
                        };

                        actionsDiv.appendChild(insertBtn);
                        actionsDiv.appendChild(copyBtn);
                        pre.style.position = 'relative';
                        pre.insertBefore(actionsDiv, codeBlock);
                    });
                }

                // 메시지 수신
                window.addEventListener('message', event => {
                    const message = event.data;

                    switch (message.type) {
                        case 'addMessage':
                            addMessage(message.message.role, message.message.content);
                            break;

                        case 'startStreaming':
                            isStreaming = true;
                            sendButton.disabled = true;
                            currentStreamingMessage = addMessage('assistant', '');
                            currentStreamingMessage.querySelector('.message-content').classList.add('streaming');
                            break;

                        case 'streamChunk':
                            if (currentStreamingMessage) {
                                const contentDiv = currentStreamingMessage.querySelector('.message-content');
                                const currentText = contentDiv.getAttribute('data-text') || '';
                                const newText = currentText + message.chunk;
                                contentDiv.setAttribute('data-text', newText);
                                contentDiv.innerHTML = formatMessage(newText);
                                chatContainer.scrollTop = chatContainer.scrollHeight;
                            }
                            break;

                        case 'endStreaming':
                            isStreaming = false;
                            sendButton.disabled = false;
                            if (currentStreamingMessage) {
                                currentStreamingMessage.querySelector('.message-content').classList.remove('streaming');
                                addCodeActions(currentStreamingMessage);
                                currentStreamingMessage = null;
                            }
                            break;

                        case 'clearChat':
                            chatContainer.innerHTML = '';
                            break;

                        case 'error':
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'error';
                            errorDiv.textContent = '오류: ' + message.message;
                            chatContainer.appendChild(errorDiv);
                            isStreaming = false;
                            sendButton.disabled = false;
                            if (currentStreamingMessage) {
                                currentStreamingMessage.querySelector('.message-content').classList.remove('streaming');
                                currentStreamingMessage = null;
                            }
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }
}
