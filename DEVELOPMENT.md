# Open Copilot 개발 가이드

## 개발 환경 설정

### 필수 도구
- Node.js 18+
- npm 또는 yarn
- TypeScript
- VSCode

### 개발 시작

```bash
# 의존성 설치
npm install

# TypeScript 컴파일 (watch 모드)
npm run watch

# Extension 테스트
# VSCode에서 F5를 누르면 Extension Development Host가 실행됩니다
```

## 프로젝트 구조

```
c:\customagent/
├── src/
│   ├── extension.ts              # Extension 진입점
│   ├── services/
│   │   └── ollamaService.ts      # Ollama API 통신
│   └── providers/
│       ├── chatViewProvider.ts    # 채팅 UI
│       ├── inlineCompletionProvider.ts  # 코드 완성
│       └── codeActionProvider.ts  # 코드 액션
├── resources/
│   └── icon.svg                   # Extension 아이콘
├── package.json                   # Extension manifest
├── tsconfig.json                  # TypeScript 설정
└── README.md                      # 문서
```

## 주요 컴포넌트

### 1. OllamaService
Ollama API와 통신하는 핵심 서비스
- `generateCompletion()`: 일반 텍스트 생성
- `getChatCompletion()`: 대화형 생성
- 스트리밍 지원

### 2. InlineCompletionProvider
타이핑 중 자동 코드 완성 제공
- VSCode의 InlineCompletionItemProvider 구현
- 디바운싱으로 성능 최적화
- 컨텍스트 기반 프롬프트 생성

### 3. ChatViewProvider
웹뷰 기반 채팅 인터페이스
- 스트리밍 응답 표시
- 코드 블록 하이라이팅
- 코드 삽입/복사 기능

### 4. CodeActionProvider
빠른 수정 및 리팩토링 제안
- Quick Fix
- Refactoring
- Optimization

## Extension API 사용

### 명령어 등록
```typescript
context.subscriptions.push(
    vscode.commands.registerCommand('opencopilot.myCommand', () => {
        // 명령 실행
    })
);
```

### 인라인 완성 제공자
```typescript
vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    completionProvider
);
```

### 웹뷰 등록
```typescript
vscode.window.registerWebviewViewProvider(
    'opencopilot.chatView',
    chatViewProvider
);
```

## 디버깅

1. VSCode에서 `F5` 누르기
2. Extension Development Host가 시작됨
3. 개발자 도구: `Help` → `Toggle Developer Tools`
4. 로그 확인: `Output` 패널 → `Extension Host` 선택

## 테스트

```bash
# 린트 실행
npm run lint

# 컴파일 테스트
npm run compile
```

## Extension 패키징

```bash
# vsce 설치 (한 번만)
npm install -g @vscode/vsce

# .vsix 파일 생성
vsce package

# 생성된 파일: open-copilot-1.0.0.vsix
```

## 배포

### 로컬 설치
```bash
code --install-extension open-copilot-1.0.0.vsix
```

### Marketplace 배포
1. [Visual Studio Marketplace](https://marketplace.visualstudio.com/) 계정 생성
2. Personal Access Token 생성
3. `vsce publish` 실행

## 기여 가이드라인

### 코드 스타일
- TypeScript strict 모드 사용
- ESLint 규칙 준수
- 의미있는 변수/함수명
- 적절한 주석

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드/설정 변경
```

### Pull Request
1. Fork 및 브랜치 생성
2. 변경사항 구현
3. 테스트 및 문서 업데이트
4. PR 생성 및 설명 작성

## 성능 최적화 팁

1. **디바운싱**: 자주 호출되는 함수에 디바운싱 적용
2. **캐싱**: 반복되는 요청 결과 캐시
3. **스트리밍**: 긴 응답은 스트리밍으로 처리
4. **타임아웃**: 너무 오래 걸리는 요청은 타임아웃 설정
5. **컨텍스트 제한**: 프롬프트 크기를 적절히 제한

## 문제 해결

### 빌드 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

### TypeScript 오류
```bash
# 타입 정의 업데이트
npm install --save-dev @types/node @types/vscode
```

## 참고 자료

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
