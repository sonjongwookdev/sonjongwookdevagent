import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    images?: string[];
}

interface AttachmentPayload {
    notes?: string[];
    images?: Array<{ name: string; base64: string }>;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private messages: Message[] = [];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly ollamaService: OllamaService
    ) {
        // 설정 변경 감지
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('opencopilot.modelMode') || 
                e.affectsConfiguration('opencopilot.model')) {
                this.updateModelInfo();
            }
        });
    }

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

        // 초기 모델 정보 전송
        this.updateModelInfo();

        // 웹뷰 메시지 처리
        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'webviewReady':
                    await this.updateModelInfo();
                    break;
                case 'refreshModels':
                    await this.updateModelInfo();
                    break;
                case 'setModelMode': {
                    const mode = data.mode === 'manual' ? 'manual' : 'auto';
                    const config = vscode.workspace.getConfiguration('opencopilot');
                    await config.update('modelMode', mode, true);
                    await this.updateModelInfo();
                    break;
                }
                case 'setManualModel': {
                    const selectedModel = typeof data.model === 'string' ? data.model : '';
                    if (!selectedModel) {
                        break;
                    }
                    const config = vscode.workspace.getConfiguration('opencopilot');
                    await config.update('model', selectedModel, true);
                    await config.update('modelMode', 'manual', true);
                    await this.updateModelInfo();
                    break;
                }
                case 'sendMessage':
                    await this.handleUserMessage(data.message, data.attachments);
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

    private async handleUserMessage(userMessage: string, attachments?: AttachmentPayload) {
        if (!this._view) {
            return;
        }

        const notes = (attachments?.notes || []).filter(Boolean);
        const imagePayloads = (attachments?.images || []).filter(img => img?.base64);
        const imageNames = imagePayloads.map(img => img.name || 'image');

        let composedMessage = userMessage;
        if (notes.length > 0 || imageNames.length > 0) {
            const attachmentLines: string[] = [];
            if (notes.length > 0) {
                attachmentLines.push('첨부 파일/폴더:');
                attachmentLines.push(...notes.map(n => `- ${n}`));
            }
            if (imageNames.length > 0) {
                attachmentLines.push('첨부 이미지:');
                attachmentLines.push(...imageNames.map(n => `- ${n}`));
            }
            composedMessage += `\n\n[첨부 정보]\n${attachmentLines.join('\n')}`;
        }

        const userDisplayMessage = imageNames.length > 0
            ? `${userMessage}\n\n(이미지 ${imageNames.length}개 첨부)`
            : userMessage;

        // 사용자 메시지 추가
        this.messages.push({
            role: 'user',
            content: composedMessage,
            images: imagePayloads.map(img => img.base64),
        });
        this._view.webview.postMessage({
            type: 'addMessage',
            message: { role: 'user', content: userDisplayMessage },
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

    private async updateModelInfo(): Promise<void> {
        if (!this._view) {
            return;
        }

        try {
            this._view.webview.postMessage({
                type: 'modelLoading',
                percent: 10,
                task: 'Ollama 연결 확인 중'
            });

            const config = vscode.workspace.getConfiguration('opencopilot');
            const modelMode = config.get<string>('modelMode', 'auto');

            this._view.webview.postMessage({
                type: 'modelLoading',
                percent: 45,
                task: modelMode === 'auto' ? '최적 모델 계산 중' : '수동 모델 확인 중'
            });

            const currentModel = await this.ollamaService.getModel();

            this._view.webview.postMessage({
                type: 'modelLoading',
                percent: 75,
                task: '설치된 모델 목록 불러오는 중'
            });

            const availableModels = await this.ollamaService.listModels();

            this._view.webview.postMessage({
                type: 'updateModel',
                model: currentModel,
                mode: modelMode,
                models: availableModels
            });

            this._view.webview.postMessage({
                type: 'modelLoading',
                percent: 100,
                task: '모델 준비 완료'
            });
        } catch (error) {
            console.error('[손종욱 AI 비서] 모델 정보 업데이트 실패:', error);
            this._view.webview.postMessage({
                type: 'modelLoading',
                percent: 0,
                task: '모델 정보 로딩 실패',
                isError: true
            });
        }
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

                #top-bar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    margin-bottom: 8px;
                    padding: 8px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    background-color: var(--vscode-sideBar-background);
                }

                .top-controls {
                    display: flex;
                    gap: 6px;
                    flex: 1;
                }

                .top-controls select,
                .top-controls button {
                    background-color: var(--vscode-dropdown-background);
                    color: var(--vscode-dropdown-foreground);
                    border: 1px solid var(--vscode-dropdown-border);
                    border-radius: 6px;
                    padding: 6px 8px;
                    font-size: 12px;
                    min-height: 30px;
                }

                .top-controls button {
                    cursor: pointer;
                }

                #model-mode-select {
                    width: 90px;
                }

                #model-select {
                    flex: 1;
                }

                #model-status {
                    font-size: 11px;
                    opacity: 0.85;
                    margin-bottom: 8px;
                    color: var(--vscode-descriptionForeground);
                }

                #chat-container {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    flex: 1;
                    overflow-y: auto;
                    margin-bottom: 10px;
                    padding: 8px 4px;
                }

                .message {
                    max-width: 88%;
                    padding: 10px 12px;
                    border-radius: 12px;
                }

                .message.user {
                    margin-left: auto;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border-radius: 12px 12px 4px 12px;
                }

                .message.assistant {
                    margin-right: auto;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    border-radius: 12px 12px 12px 4px;
                }

                .message-role {
                    display: none;
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
                    gap: 8px;
                    padding-top: 10px;
                    align-items: stretch;
                }

                #message-input {
                    flex: 1;
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border: 1px solid var(--vscode-input-border);
                    padding: 10px 12px;
                    border-radius: 12px;
                    font-family: var(--vscode-font-family);
                    resize: vertical;
                    min-height: 72px;
                }

                #composer-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                #attachment-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    min-height: 0;
                }

                .attachment-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    max-width: 100%;
                    padding: 4px 8px;
                    border-radius: 999px;
                    border: 1px solid var(--vscode-panel-border);
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                    font-size: 11px;
                }

                .attachment-chip .name {
                    max-width: 180px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .attachment-chip .remove {
                    border: none;
                    background: transparent;
                    color: inherit;
                    cursor: pointer;
                    padding: 0 2px;
                    border-radius: 4px;
                    font-size: 11px;
                }

                #message-input:focus {
                    outline: 1px solid var(--vscode-focusBorder);
                }

                .button-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    width: 70px;
                }

                button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 10px 12px;
                    cursor: pointer;
                    border-radius: 10px;
                    white-space: nowrap;
                }

                #send-button {
                    font-weight: 600;
                    min-height: 44px;
                    border-radius: 12px;
                }

                #clear-button {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    min-height: 40px;
                }

                #clear-button:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }

                #attach-button {
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    min-height: 36px;
                }

                #attach-button:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
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
                    border-radius: 10px;
                    margin: 10px 0;
                }

                #model-loading {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 8px;
                    padding: 8px;
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 10px;
                    background-color: var(--vscode-editor-inactiveSelectionBackground);
                }

                #model-loading-percent {
                    min-width: 42px;
                    text-align: center;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 6px;
                    border-radius: 999px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                }

                #model-loading-task {
                    font-size: 11px;
                    color: var(--vscode-descriptionForeground);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 180px;
                }

                #model-loading-track {
                    flex: 1;
                    height: 6px;
                    border-radius: 999px;
                    background-color: var(--vscode-input-background);
                    overflow: hidden;
                }

                #model-loading-fill {
                    height: 100%;
                    width: 0%;
                    background-color: var(--vscode-progressBar-background);
                    transition: width 0.25s ease;
                }

            </style>
        </head>
        <body>
            <div id="top-bar">
                <div class="top-controls">
                    <select id="model-mode-select" title="모델 선택 모드">
                        <option value="auto">Auto</option>
                        <option value="manual">Manual</option>
                    </select>
                    <select id="model-select" title="모델 선택"></select>
                    <button id="refresh-models" title="모델 목록 새로고침">새로고침</button>
                </div>
            </div>
            <div id="model-loading">
                <div id="model-loading-percent">0%</div>
                <div id="model-loading-track"><div id="model-loading-fill"></div></div>
                <div id="model-loading-task">로컬 모델 준비 중</div>
            </div>
            <div id="model-status">로컬 모델 준비 중...</div>
            <div id="chat-container"></div>
            <div id="input-container">
                <div id="composer-left">
                    <div id="attachment-list"></div>
                    <textarea id="message-input" placeholder="질문을 입력하세요... (Ctrl+Enter로 전송)"></textarea>
                </div>
                <div class="button-group">
                    <button id="attach-button" title="파일/폴더/이미지 첨부">첨부</button>
                    <button id="send-button">전송</button>
                    <button id="clear-button">초기화</button>
                </div>
            </div>
            <input id="file-input" type="file" multiple style="display:none;" />

            <script>
                const vscode = acquireVsCodeApi();
                const chatContainer = document.getElementById('chat-container');
                const messageInput = document.getElementById('message-input');
                const sendButton = document.getElementById('send-button');
                const clearButton = document.getElementById('clear-button');
                const attachButton = document.getElementById('attach-button');
                const fileInput = document.getElementById('file-input');
                const attachmentList = document.getElementById('attachment-list');
                const modelModeSelect = document.getElementById('model-mode-select');
                const modelSelect = document.getElementById('model-select');
                const refreshModelsButton = document.getElementById('refresh-models');
                const modelStatus = document.getElementById('model-status');
                const modelLoadingPercent = document.getElementById('model-loading-percent');
                const modelLoadingTask = document.getElementById('model-loading-task');
                const modelLoadingFill = document.getElementById('model-loading-fill');

                let isStreaming = false;
                let currentStreamingMessage = null;
                let attachments = [];

                sendButton.addEventListener('click', sendMessage);
                clearButton.addEventListener('click', clearChat);
                attachButton.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', async () => {
                    await addFiles(Array.from(fileInput.files || []));
                    fileInput.value = '';
                });
                refreshModelsButton.addEventListener('click', () => {
                    vscode.postMessage({ type: 'refreshModels' });
                });

                modelModeSelect.addEventListener('change', () => {
                    const mode = modelModeSelect.value;
                    modelSelect.disabled = mode !== 'manual';
                    vscode.postMessage({ type: 'setModelMode', mode });
                });

                modelSelect.addEventListener('change', () => {
                    if (modelModeSelect.value !== 'manual') {
                        return;
                    }
                    const selectedModel = modelSelect.value;
                    if (!selectedModel) {
                        return;
                    }
                    vscode.postMessage({
                        type: 'setManualModel',
                        model: selectedModel
                    });
                });

                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                });

                messageInput.addEventListener('paste', async (e) => {
                    const items = Array.from((e.clipboardData && e.clipboardData.items) || []);
                    const fileItems = items.filter(item => item.kind === 'file');
                    if (fileItems.length === 0) {
                        return;
                    }

                    e.preventDefault();
                    const files = fileItems
                        .map(item => item.getAsFile())
                        .filter(Boolean);
                    await addFiles(files);
                });

                messageInput.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    messageInput.style.outline = '1px solid var(--vscode-focusBorder)';
                });

                messageInput.addEventListener('dragleave', () => {
                    messageInput.style.outline = '';
                });

                messageInput.addEventListener('drop', async (e) => {
                    e.preventDefault();
                    messageInput.style.outline = '';
                    const dt = e.dataTransfer;
                    if (!dt) {
                        return;
                    }

                    const itemList = Array.from(dt.items || []);
                    const entries = itemList
                        .map(item => item.webkitGetAsEntry && item.webkitGetAsEntry())
                        .filter(Boolean);

                    if (entries.length > 0) {
                        await addEntries(entries);
                        return;
                    }

                    await addFiles(Array.from(dt.files || []));
                });

                function sendMessage() {
                    const message = messageInput.value.trim();
                    if ((!message && attachments.length === 0) || isStreaming) return;

                    const payload = buildAttachmentPayload();

                    vscode.postMessage({
                        type: 'sendMessage',
                        message: message || '(첨부 파일/이미지 분석 요청)',
                        attachments: payload
                    });

                    messageInput.value = '';
                    attachments = [];
                    renderAttachments();
                    messageInput.focus();
                }

                function clearChat() {
                    if (confirm('채팅 기록을 모두 삭제하시겠습니까?')) {
                        vscode.postMessage({ type: 'clearChat' });
                        attachments = [];
                        renderAttachments();
                    }
                }

                function formatBytes(size) {
                    if (!size || size <= 0) return '0B';
                    const units = ['B', 'KB', 'MB', 'GB'];
                    let value = size;
                    let unitIndex = 0;
                    while (value >= 1024 && unitIndex < units.length - 1) {
                        value /= 1024;
                        unitIndex += 1;
                    }
                    return value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1) + units[unitIndex];
                }

                function renderAttachments() {
                    attachmentList.innerHTML = '';
                    attachments.forEach((item, index) => {
                        const chip = document.createElement('div');
                        chip.className = 'attachment-chip';

                        const name = document.createElement('span');
                        name.className = 'name';
                        if (item.type === 'folder') {
                            name.textContent = '📁 ' + item.name + ' (' + item.children + '개 항목)';
                        } else if (item.type === 'image') {
                            name.textContent = '🖼️ ' + item.name;
                        } else {
                            name.textContent = '📄 ' + item.name + ' (' + formatBytes(item.size) + ')';
                        }

                        const remove = document.createElement('button');
                        remove.className = 'remove';
                        remove.textContent = '✕';
                        remove.title = '첨부 제거';
                        remove.onclick = () => {
                            attachments.splice(index, 1);
                            renderAttachments();
                        };

                        chip.appendChild(name);
                        chip.appendChild(remove);
                        attachmentList.appendChild(chip);
                    });
                }

                function readFileAsDataUrl(file) {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result || '');
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                }

                async function addFiles(files) {
                    for (const file of files) {
                        if (!file) continue;
                        if (file.type && file.type.startsWith('image/')) {
                            const dataUrl = await readFileAsDataUrl(file);
                            const base64 = String(dataUrl).split(',')[1] || '';
                            attachments.push({
                                type: 'image',
                                name: file.name || 'image',
                                size: file.size || 0,
                                base64,
                            });
                        } else {
                            attachments.push({
                                type: 'file',
                                name: file.name || 'file',
                                size: file.size || 0,
                            });
                        }
                    }
                    renderAttachments();
                }

                function walkEntry(entry, path, collector) {
                    return new Promise((resolve) => {
                        if (entry.isFile) {
                            entry.file((file) => {
                                collector.push({
                                    type: file.type && file.type.startsWith('image/') ? 'image' : 'file',
                                    name: path + file.name,
                                    size: file.size || 0,
                                    file,
                                });
                                resolve();
                            }, () => resolve());
                            return;
                        }

                        if (entry.isDirectory) {
                            const dirReader = entry.createReader();
                            const folderItem = {
                                type: 'folder',
                                name: path + entry.name,
                                children: 0,
                            };
                            attachments.push(folderItem);

                            const readEntries = () => {
                                dirReader.readEntries(async (entries) => {
                                    if (!entries.length) {
                                        resolve();
                                        return;
                                    }
                                    folderItem.children += entries.length;
                                    for (const child of entries) {
                                        await walkEntry(child, path + entry.name + '/', collector);
                                    }
                                    readEntries();
                                }, () => resolve());
                            };

                            readEntries();
                            return;
                        }

                        resolve();
                    });
                }

                async function addEntries(entries) {
                    const collectedFiles = [];
                    for (const entry of entries) {
                        await walkEntry(entry, '', collectedFiles);
                    }

                    for (const item of collectedFiles) {
                        if (item.type === 'image') {
                            const dataUrl = await readFileAsDataUrl(item.file);
                            const base64 = String(dataUrl).split(',')[1] || '';
                            attachments.push({
                                type: 'image',
                                name: item.name,
                                size: item.size,
                                base64,
                            });
                        } else {
                            attachments.push({
                                type: 'file',
                                name: item.name,
                                size: item.size,
                            });
                        }
                    }

                    renderAttachments();
                }

                function buildAttachmentPayload() {
                    const notes = attachments
                        .filter(item => item.type === 'file' || item.type === 'folder')
                        .map(item => {
                            if (item.type === 'folder') {
                                return '폴더: ' + item.name + ' (' + item.children + '개 항목)';
                            }
                            return '파일: ' + item.name + ' (' + formatBytes(item.size) + ')';
                        });

                    const images = attachments
                        .filter(item => item.type === 'image' && item.base64)
                        .map(item => ({
                            name: item.name,
                            base64: item.base64,
                        }));

                    return { notes, images };
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

                function updateModelOptions(models, currentModel) {
                    const safeModels = Array.isArray(models) ? models : [];
                    modelSelect.innerHTML = '';

                    if (safeModels.length === 0) {
                        const option = document.createElement('option');
                        option.value = '';
                        option.textContent = '모델 없음 (ollama pull 필요)';
                        modelSelect.appendChild(option);
                        return;
                    }

                    safeModels.forEach(modelName => {
                        const option = document.createElement('option');
                        option.value = modelName;
                        option.textContent = modelName;
                        if (modelName === currentModel) {
                            option.selected = true;
                        }
                        modelSelect.appendChild(option);
                    });
                }

                function setModelLoading(percent, task, isError) {
                    const safePercent = Math.max(0, Math.min(100, Number(percent) || 0));
                    modelLoadingPercent.textContent = safePercent + '%';
                    modelLoadingTask.textContent = task || '로컬 모델 준비 중';
                    modelLoadingFill.style.width = safePercent + '%';
                    modelLoadingPercent.style.backgroundColor = isError
                        ? 'var(--vscode-inputValidation-errorBorder)'
                        : 'var(--vscode-button-background)';
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

                        case 'updateModel':
                            modelModeSelect.value = message.mode === 'manual' ? 'manual' : 'auto';
                            modelSelect.disabled = modelModeSelect.value !== 'manual';
                            updateModelOptions(message.models, message.model);
                            setModelLoading(100, '모델 준비 완료', false);
                            modelStatus.textContent = 
                                modelModeSelect.value === 'auto'
                                    ? '현재 모델: ' + message.model + ' (Auto - 로컬 최적 모델 선택)'
                                    : '현재 모델: ' + message.model + ' (Manual - 직접 선택)';
                            break;

                        case 'modelLoading':
                            setModelLoading(message.percent, message.task, !!message.isError);
                            break;
                    }
                });

                vscode.postMessage({ type: 'webviewReady' });
            </script>
        </body>
        </html>`;
    }
}
