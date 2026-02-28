# Open Copilot - 빠른 시작 가이드

## 1분 안에 시작하기

### 1. Ollama 설치 및 실행

```bash
# Windows: https://ollama.ai/download에서 다운로드

# Mac/Linux:
curl -fsSL https://ollama.ai/install.sh | sh

# 모델 다운로드 (택 1)
ollama pull deepseek-coder:6.7b   # 코딩 특화
ollama pull glm4:9b                # 한국어 지원 우수
```

### 2. Extension 설치

```bash
# 의존성 설치
npm install

# 컴파일
npm run compile

# VSCode에서 F5를 눌러 Extension Development Host 실행
```

### 3. 사용 시작

1. `Ctrl+Shift+L`로 채팅 열기
2. 코드 타이핑 시 자동 완성
3. 코드 선택 후 우클릭 → "Open Copilot" 메뉴 사용

## 주요 명령어

| 기능 | 단축키 | 명령어 |
|-----|--------|--------|
| 채팅 시작 | `Ctrl+Shift+L` | Open Copilot: 채팅 시작 |
| 코드 설명 | `Ctrl+Shift+E` | Open Copilot: 코드 설명 |
| 인라인 완성 토글 | - | Open Copilot: 인라인 완성 토글 |

## 문제 해결

**연결 실패?**
```bash
# Ollama 실행 확인
ollama list

# 재시작
ollama serve
```

**느린 응답?**
```json
{
  "opencopilot.model": "codellama:7b-code",  // 더 작은 모델 사용
  "opencopilot.completionDelay": 500  // 지연 시간 증가
}
```

## 팁

💡 **최고의 경험을 위해:**
- GPU가 있다면 자동으로 가속됩니다
- 16GB+ RAM 권장
- `deepseek-coder:6.7b` 모델 추천
- Temperature 0.2로 일관성 있는 코드 생성

## 더 알아보기

자세한 내용은 [README.md](README.md)를 참조하세요.
