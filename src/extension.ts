import * as vscode from 'vscode';
import { OllamaService } from './services/ollamaService';
import { InlineCompletionProvider } from './providers/inlineCompletionProvider';
import { ChatViewProvider } from './providers/chatViewProvider';
import { CodeActionProvider } from './providers/codeActionProvider';

let ollamaService: OllamaService;
let chatViewProvider: ChatViewProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('손종욱 전용 AI 코딩 비서가 활성화되었습니다!');

    // Ollama 서비스 초기화
    ollamaService = new OllamaService();

    // 채팅 뷰 제공자 등록
    chatViewProvider = new ChatViewProvider(context.extensionUri, ollamaService);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'opencopilot.chatView',
            chatViewProvider
        )
    );

    // 인라인 완성 제공자 등록
    const config = vscode.workspace.getConfiguration('opencopilot');
    if (config.get('enableInlineCompletion')) {
        const completionProvider = new InlineCompletionProvider(ollamaService);
        context.subscriptions.push(
            vscode.languages.registerInlineCompletionItemProvider(
                { pattern: '**' },
                completionProvider
            )
        );
    }

    // 코드 액션 제공자 등록
    const codeActionProvider = new CodeActionProvider(ollamaService);
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(
            { pattern: '**' },
            codeActionProvider,
            {
                providedCodeActionKinds: CodeActionProvider.providedCodeActionKinds
            }
        )
    );

    // 명령어 등록
    registerCommands(context);

    // Ollama 설치 가이드 명령 등록
    context.subscriptions.push(
        vscode.commands.registerCommand('opencopilot.openOllamaGuide', async () => {
            const panel = vscode.window.createWebviewPanel(
                'ollamaGuide',
                'Ollama 설치 가이드',
                vscode.ViewColumn.One,
                { enableScripts: true }
            );

            panel.webview.html = getOllamaGuideHtml();
        })
    );

    // 상태 표시줄 아이템
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.text = "$(comment-discussion) 손종욱 AI 비서";
    statusBarItem.command = 'opencopilot.startChat';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // 연결 테스트
    testConnection();
}

function registerCommands(context: vscode.ExtensionContext) {
    // 채팅 시작
    context.subscriptions.push(
        vscode.commands.registerCommand('opencopilot.startChat', () => {
            vscode.commands.executeCommand('opencopilot.chatView.focus');
        })
    );

    // 코드 설명
    context.subscriptions.push(
        vscode.commands.registerCommand('opencopilot.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            if (!text) {
                vscode.window.showWarningMessage('코드를 선택해주세요.');
                return;
            }

            const prompt = `다음 코드를 자세히 설명해주세요:\n\n${text}`;
            await chatViewProvider.sendMessage(prompt);
            vscode.commands.executeCommand('opencopilot.chatView.focus');
        })
    );

    // 코드 리팩토링
    context.subscriptions.push(
        vscode.commands.registerCommand('opencopilot.refactorCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            if (!text) {
                vscode.window.showWarningMessage('코드를 선택해주세요.');
                return;
            }

            const language = editor.document.languageId;
            const prompt = `다음 ${language} 코드를 리팩토링하고 개선점을 제안해주세요. 개선된 코드만 제공해주세요:\n\n${text}`;
            
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "코드 리팩토링 중...",
                cancellable: false
            }, async () => {
                const result = await ollamaService.generateCompletion(prompt);
                
                // 결과를 에디터에 적용
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, result);
                });

                return Promise.resolve();
            });
        })
    );

    // 코드 수정
    context.subscriptions.push(
        vscode.commands.registerCommand('opencopilot.fixCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            if (!text) {
                vscode.window.showWarningMessage('코드를 선택해주세요.');
                return;
            }

            const language = editor.document.languageId;
            const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
            const errorInfo = diagnostics.length > 0 
                ? `\n\n알려진 오류:\n${diagnostics.map(d => `- ${d.message}`).join('\n')}`
                : '';

            const prompt = `다음 ${language} 코드의 버그를 찾아 수정해주세요. 수정된 코드만 제공해주세요:${errorInfo}\n\n${text}`;
            
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "코드 수정 중...",
                cancellable: false
            }, async () => {
                const result = await ollamaService.generateCompletion(prompt);
                
                await editor.edit(editBuilder => {
                    editBuilder.replace(selection, result);
                });

                return Promise.resolve();
            });
        })
    );

    // 테스트 생성
    context.subscriptions.push(
        vscode.commands.registerCommand('opencopilot.generateTests', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            if (!text) {
                vscode.window.showWarningMessage('코드를 선택해주세요.');
                return;
            }

            const language = editor.document.languageId;
            const prompt = `다음 ${language} 코드에 대한 단위 테스트를 생성해주세요:\n\n${text}`;
            
            await chatViewProvider.sendMessage(prompt);
            vscode.commands.executeCommand('opencopilot.chatView.focus');
        })
    );

    // 문서 생성
    context.subscriptions.push(
        vscode.commands.registerCommand('opencopilot.generateDocs', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                return;
            }

            const selection = editor.selection;
            const text = editor.document.getText(selection);
            
            if (!text) {
                vscode.window.showWarningMessage('코드를 선택해주세요.');
                return;
            }

            const language = editor.document.languageId;
            const prompt = `다음 ${language} 코드에 대한 문서화 주석을 생성해주세요 (JSDoc, docstring 등):\n\n${text}`;
            
            const result = await ollamaService.generateCompletion(prompt);
            
            // 선택 영역 위에 문서 삽입
            await editor.edit(editBuilder => {
                editBuilder.insert(selection.start, result + '\n');
            });
        })
    );

    // 인라인 완성 토글
    context.subscriptions.push(
        vscode.commands.registerCommand('opencopilot.inlineCompletion', async () => {
            const config = vscode.workspace.getConfiguration('opencopilot');
            const current = config.get('enableInlineCompletion');
            await config.update('enableInlineCompletion', !current, true);
            vscode.window.showInformationMessage(
                `인라인 완성이 ${!current ? '활성화' : '비활성화'}되었습니다.`
            );
        })
    );
}

async function testConnection() {
    try {
        const config = vscode.workspace.getConfiguration('opencopilot');
        const url = config.get<string>('ollamaUrl', 'http://localhost:11434');
        
        // Ollama 연결 시도
        const isConnected = await ollamaService.testConnection();
        
        if (isConnected) {
            vscode.window.showInformationMessage(
                '✓ Ollama에 성공적으로 연결되었습니다! 손종욱 AI 비서가 준비되었습니다.'
            );
        } else {
            // Ollama가 설치되지 않았거나 실행 중이지 않음
            const options = [
                '📖 설치 가이드 보기',
                '🔄 재시도',
                '❌ 닫기'
            ];
            
            const selected = await vscode.window.showErrorMessage(
                `❌ Ollama에 연결할 수 없습니다 (${url})\n\n손종욱 AI 비서를 사용하려면 Ollama가 필요합니다.`,
                ...options
            );
            
            if (selected === options[0]) {
                // 설치 가이드 열기
                vscode.commands.executeCommand('opencopilot.openOllamaGuide');
            } else if (selected === options[1]) {
                // 재시도
                setTimeout(() => testConnection(), 2000);
            }
        }
    } catch (error) {
        console.error('Connection test failed:', error);
        
        const options = [
            '📖 설치 가이드 보기',
            '🔄 재시도',
            '❌ 닫기'
        ];
        
        const selected = await vscode.window.showErrorMessage(
            '❌ Ollama 연결 확인 중 오류가 발생했습니다.\nOllama가 설치되어 있고 실행 중인지 확인해주세요.',
            ...options
        );
        
        if (selected === options[0]) {
            vscode.commands.executeCommand('opencopilot.openOllamaGuide');
        } else if (selected === options[1]) {
            setTimeout(() => testConnection(), 2000);
        }
    }
}

function getOllamaGuideHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            padding: 30px; 
            line-height: 1.8;
            color: #e0e0e0;
            background: #1e1e1e;
        }
        h1 { color: #4ec9b0; margin-bottom: 20px; font-size: 2em; }
        h2 { color: #9cdcfe; margin-top: 30px; margin-bottom: 15px; font-size: 1.3em; }
        h3 { color: #ce9178; margin-top: 15px; margin-bottom: 10px; }
        p { margin-bottom: 10px; }
        a { color: #569cd6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        code { 
            background: #2d2d30; 
            padding: 2px 6px; 
            border-radius: 3px;
            color: #ce9178;
            font-family: 'Courier New', monospace;
        }
        .code-block { 
            background: #2d2d30; 
            padding: 15px; 
            border-radius: 5px; 
            border-left: 3px solid #4ec9b0;
            margin: 15px 0;
            overflow-x: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .warning { 
            background: #3d2626; 
            border-left: 4px solid #f48771;
            padding: 15px; 
            margin: 20px 0;
            border-radius: 3px;
        }
        .success { 
            background: #26332d; 
            border-left: 4px solid #4ec9b0;
            padding: 15px; 
            margin: 20px 0;
            border-radius: 3px;
        }
        .info {
            background: #1e3a4d;
            border-left: 4px solid #569cd6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 3px;
        }
        ol { padding-left: 30px; }
        li { margin-bottom: 10px; }
    </style>
</head>
<body>
    <h1>🚀 Ollama 설치 가이드</h1>
    
    <div class="warning">
        <strong>⚠️ 손종욱 전용 AI 코딩 비서 시작!</strong><br>
        손종욱 전용 AI 코딩 비서를 사용하려면 <strong>Ollama</strong>를 먼저 설치해야 합니다.
    </div>

    <h2>📦 Windows 설치 (가장 간단한 방법)</h2>
    <ol>
        <li><a href="https://ollama.ai/download" target="_blank"><strong>https://ollama.ai/download</strong></a> 방문</li>
        <li><strong>"Download for Windows"</strong> 버튼 클릭</li>
        <li>다운로드된 <code>OllamaSetup.exe</code> 파일 실행</li>
        <li>설치 마법사를 따라 설치 진행</li>
        <li>설치 완료 후 자동으로 Ollama 실행됨</li>
    </ol>
    <div class="info">
        <strong>💡 팁:</strong> Windows에는 별도의 스타트 메뉴에 Ollama가 추가됩니다.
    </div>

    <h2>🍎 Mac 설치</h2>
    <div class="code-block">curl -fsSL https://ollama.ai/install.sh | sh</div>

    <h2>🐧 Linux 설치</h2>
    <div class="code-block">curl -fsSL https://ollama.ai/install.sh | sh</div>

    <h2>🤖 AI 모델 다운로드</h2>
    <p>PowerShell 또는 터미널을 열고 <strong>다음 중 하나</strong>를 실행하세요:</p>
    
    <h3>추천: DeepSeek Coder (코딩 최적화)</h3>
    <div class="code-block">ollama pull deepseek-coder:6.7b</div>
    <p><strong>특징:</strong> 가장 뛰어난 코딩 능력, 균형잡힌 성능 (약 6.7GB)</p>

    <h3>또는: GLM-4 (한국어 우수)</h3>
    <div class="code-block">ollama pull glm4:9b</div>
    <p><strong>특징:</strong> 한국어 지원 우수, 다국어 지원, 뛰어난 성능 (약 5GB)</p>

    <h3>빠른 테스트용: 소형 모델</h3>
    <div class="code-block">ollama pull deepseek-coder:1.3b</div>
    <p><strong>특징:</strong> 빠른 응답, 저사양 PC용 (약 1.3GB)</p>

    <h2>✅ 설치 확인</h2>
    <p>다음 명령어로 설치된 모델을 확인하세요:</p>
    <div class="code-block">ollama list</div>

    <h2>다음 단계</h2>
    <div class="success">
        <strong>✓ 설치 완료!</strong><br><br>
        1. <strong>VSCode를 재시작</strong>하세요<br>
        2. 손종욱 전용 AI 코딩 비서가 <strong>자동으로 Ollama에 연결</strong>됩니다<br>
        3. <strong>Ctrl+Shift+L</strong>을 눌러 채팅 시작!
    </div>

    <h2>📚 추가 정보</h2>
    <ul>
        <li><a href="https://ollama.ai" target="_blank">📌 Ollama 공식 사이트</a></li>
        <li><a href="https://ollama.ai/library" target="_blank">📚 사용 가능한 모든 모델</a></li>
        <li><a href="https://github.com/ollama/ollama" target="_blank">🔗 Ollama GitHub</a></li>
    </ul>
</body>
</html>
    `;
}

export function deactivate() {
    console.log('손종욱 전용 AI 코딩 비서가 비활성화되었습니다.');
}
