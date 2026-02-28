import * as vscode from 'vscode';
import { OllamaService } from '../services/ollamaService';

export class CodeActionProvider implements vscode.CodeActionProvider {
    public static readonly providedCodeActionKinds = [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.RefactorRewrite,
    ];

    constructor(private ollamaService: OllamaService) {}

    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];

        // 선택된 텍스트가 있을 때만 액션 제공
        if (range.isEmpty) {
            return actions;
        }

        // 에러/경고가 있을 때 수정 액션 추가
        const diagnostics = context.diagnostics;
        if (diagnostics.length > 0) {
            const fixAction = this.createFixAction(document, range, diagnostics);
            actions.push(fixAction);
        }

        // 리팩토링 액션 추가
        const refactorAction = this.createRefactorAction(document, range);
        actions.push(refactorAction);

        // 최적화 액션 추가
        const optimizeAction = this.createOptimizeAction(document, range);
        actions.push(optimizeAction);

        return actions;
    }

    private createFixAction(
        document: vscode.TextDocument,
        range: vscode.Range,
        diagnostics: readonly vscode.Diagnostic[]
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            '🤖 AI로 문제 수정',
            vscode.CodeActionKind.QuickFix
        );

        action.command = {
            command: 'opencopilot.fixCode',
            title: 'AI로 코드 수정',
            arguments: [document, range, diagnostics],
        };

        action.diagnostics = [...diagnostics];
        action.isPreferred = true;

        return action;
    }

    private createRefactorAction(
        document: vscode.TextDocument,
        range: vscode.Range
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            '🤖 AI로 리팩토링',
            vscode.CodeActionKind.RefactorRewrite
        );

        action.command = {
            command: 'opencopilot.refactorCode',
            title: 'AI로 코드 리팩토링',
            arguments: [document, range],
        };

        return action;
    }

    private createOptimizeAction(
        document: vscode.TextDocument,
        range: vscode.Range
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            '🤖 AI로 최적화',
            vscode.CodeActionKind.RefactorRewrite
        );

        const text = document.getText(range);
        action.command = {
            command: 'opencopilot.optimizeCode',
            title: 'AI로 코드 최적화',
        };

        // 최적화 명령 등록 (extension.ts에서 등록해야 함)
        return action;
    }
}
