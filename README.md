# Open Copilot 🤖

**완전한 오픈소스 AI 코딩 어시스턴트** - GitHub Copilot의 모든 기능을 100% 오픈소스로 구현

## ✨ 주요 기능

- 🚀 **실시간 코드 완성**: 타이핑하는 동안 자동으로 코드 제안
- 💬 **AI 채팅**: 코딩 질문에 대한 실시간 대화형 지원
- 🔧 **코드 리팩토링**: 선택한 코드의 품질 개선 및 최적화
- 🐛 **자동 버그 수정**: 에러를 AI가 분석하고 자동으로 수정
- 📝 **문서 자동 생성**: 함수/클래스에 대한 문서화 주석 자동 생성
- 🧪 **테스트 코드 생성**: 단위 테스트 자동 생성
- 💡 **코드 설명**: 복잡한 코드를 선택하면 자세히 설명
- 🎯 **컨텍스트 인식**: 현재 파일, 에러, 선택 영역을 자동으로 분석

## 🎯 왜 Open Copilot인가?

- ✅ **100% 오픈소스** - 모든 코드가 공개되어 있고 자유롭게 수정 가능
- ✅ **로컬 실행** - 모든 AI 처리가 로컬에서 실행되어 프라이버시 보장
- ✅ **무료** - 구독료나 API 비용 없이 완전 무료
- ✅ **커스터마이징** - 원하는 모델과 설정을 자유롭게 선택
- ✅ **오프라인 지원** - 인터넷 없이도 사용 가능

## 📋 요구사항

1. **VSCode** 1.85.0 이상
2. **Ollama** - 로컬 LLM 실행 도구

## 🚀 설치 방법

### 1단계: Ollama 설치

Ollama는 로컬에서 대형 언어 모델을 실행할 수 있게 해주는 오픈소스 도구입니다.

**Windows:**
```powershell
# https://ollama.ai/download에서 Windows 인스톨러 다운로드 및 설치
```

**MacOS:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2단계: AI 모델 다운로드

코딩에 최적화된 모델 중 하나를 다운로드하세요:

```bash
# DeepSeek Coder (추천 - 코딩 특화, 6.7GB)
ollama pull deepseek-coder:6.7b

# 또는 CodeLlama (메타의 코딩 모델, 3.8GB)
ollama pull codellama:7b

# 또는 더 작은 모델 (리소스가 제한적인 경우, 2GB)
ollama pull codellama:7b-code

# 또는 성능 중시 (더 큰 모델, 26GB)
ollama pull deepseek-coder:33b

# 또는 GLM-4.5 (Zhipu AI, 9B 파라미터, 균형잡힌 성능)
ollama pull glm4:9b
```

### 3단계: Extension 빌드 및 설치

```bash
# 프로젝트 디렉토리로 이동
cd c:\customagent

# 의존성 설치
npm install

# Extension 컴파일
npm run compile

# Extension 패키징 (선택사항)
npx vsce package

# VSCode에서 F5를 눌러 개발 모드로 테스트
# 또는 생성된 .vsix 파일을 VSCode에서 설치
```

**VSCode에서 직접 로드하기:**
1. VSCode에서 `F5` 키를 눌러 Extension Development Host 실행
2. 또는 `.vsix` 파일을 생성한 후 VSCode의 Extensions 탭에서 "Install from VSIX..." 선택

## ⚙️ 설정

VSCode 설정(`Ctrl+,`)에서 다음 항목을 구성할 수 있습니다:

```json
{
  // Ollama 서버 URL (기본: localhost)
  "opencopilot.ollamaUrl": "http://localhost:11434",
  
  // 사용할 AI 모델
  "opencopilot.model": "deepseek-coder:6.7b",
  
  // 인라인 코드 완성 활성화/비활성화
  "opencopilot.enableInlineCompletion": true,
  
  // 코드 완성 지연 시간 (밀리초)
  "opencopilot.completionDelay": 300,
  
  // 최대 토큰 수
  "opencopilot.maxTokens": 2000,
  
  // Temperature (창의성 조절, 0.0-1.0)
  "opencopilot.temperature": 0.2
}
```

## 🎮 사용 방법

### 1. 채팅으로 대화하기

- **단축키**: `Ctrl+Shift+L` (Mac: `Cmd+Shift+L`)
- 또는 왼쪽 사이드바의 Open Copilot 아이콘 클릭
- 코딩 관련 질문을 자유롭게 입력

### 2. 코드 완성

- 코드를 타이핑하면 자동으로 제안이 나타남
- `Tab` 키로 제안을 수락
- `Esc` 키로 제안을 무시

### 3. 코드 설명

1. 설명이 필요한 코드를 선택
2. `Ctrl+Shift+E` 누르기 (Mac: `Cmd+Shift+E`)
3. 또는 우클릭 → "Open Copilot" → "코드 설명"

### 4. 코드 리팩토링

1. 리팩토링할 코드를 선택
2. 우클릭 → "Open Copilot" → "코드 리팩토링"
3. AI가 개선된 코드로 자동 대체

### 5. 버그 수정

1. 버그가 있는 코드를 선택
2. 우클릭 → "Open Copilot" → "코드 수정"
3. AI가 문제를 분석하고 수정

### 6. 테스트 생성

1. 테스트할 함수/클래스를 선택
2. 우클릭 → "Open Copilot" → "테스트 생성"
3. 채팅 창에 테스트 코드가 생성됨

### 7. 문서 생성

1. 문서화할 함수/클래스를 선택
2. 우클릭 → "Open Copilot" → "문서 생성"
3. JSDoc/docstring 형식의 주석이 자동 삽입

## 🎯 지원 언어

모든 프로그래밍 언어를 지원합니다:

- JavaScript/TypeScript
- Python
- Java
- C/C++/C#
- Go
- Rust
- Ruby
- PHP
- Swift
- Kotlin
- 그 외 모든 언어

## 🔧 문제 해결

### Ollama에 연결할 수 없음

1. Ollama가 실행 중인지 확인:
   ```bash
   ollama list
   ```

2. Ollama 서비스 시작:
   ```bash
   ollama serve
   ```

3. 포트 확인 (기본: 11434):
   ```bash
   # Windows
   netstat -ano | findstr :11434
   
   # Mac/Linux
   lsof -i :11434
   ```

### 모델을 찾을 수 없음

사용하려는 모델이 다운로드되어 있는지 확인:
```bash
ollama list
```

모델이 없으면 다운로드:
```bash
ollama pull deepseek-coder:6.7b
```

### 코드 완성이 느림

1. 더 작은 모델 사용: `codellama:7b` 또는 `deepseek-coder:1.3b`
2. 완성 지연 시간 증가: `"opencopilot.completionDelay": 500`
3. GPU 가속 확인 (CUDA/Metal 설정)

### 응답 품질이 낮음

1. Temperature 조절: `"opencopilot.temperature": 0.1` (더 결정적)
2. 더 큰 모델 사용: `deepseek-coder:33b`
3. 더 구체적인 질문/선택

## 🚀 성능 최적화

### 하드웨어 권장사항

**최소 요구사항:**
- RAM: 8GB
- 저장공간: 10GB
- 모델: `codellama:7b-code` (2GB)

**권장 사양:**
- RAM: 16GB+
- GPU: NVIDIA (CUDA) 또는 Apple Silicon (Metal)
- 저장공간: 20GB
- 모델: `deepseek-coder:6.7b` (6.7GB)

**최적 사양:**
- RAM: 32GB+
- GPU: NVIDIA RTX 3060 이상 (12GB+ VRAM)
- 저장공간: 50GB
- 모델: `deepseek-coder:33b` (26GB)

### GPU 가속 설정

**NVIDIA GPU (CUDA):**
Ollama는 CUDA를 자동으로 감지하고 사용합니다.

**Apple Silicon (M1/M2/M3):**
Metal 가속이 자동으로 활성화됩니다.

**성능 확인:**
```bash
ollama run deepseek-coder:6.7b "test"
# GPU 사용 여부가 터미널에 표시됨
```

## 📚 추가 자료

### 추천 모델

| 모델 | 크기 | 용도 | 성능 |
|-----|------|-----|-----|
| `codellama:7b-code` | 2GB | 빠른 완성, 저사양 | ⭐⭐⭐ |
| `codellama:7b` | 3.8GB | 범용 코딩 | ⭐⭐⭐⭐ |
| `deepseek-coder:6.7b` | 6.7GB | 코딩 특화 (추천) | ⭐⭐⭐⭐⭐ |
| `glm4:9b` | 5GB | 다국어 지원, 균형잡힌 성능 | ⭐⭐⭐⭐⭐ |
| `deepseek-coder:33b` | 26GB | 최고 품질 | ⭐⭐⭐⭐⭐⭐ |

### GLM-4 모델 사용하기

한국어 지원이 우수한 GLM-4 모델 사용법은 [GLM4_GUIDE.md](GLM4_GUIDE.md)를 참조하세요.

```powershell
ollama pull glm4:9b
```

### 커스텀 Ollama 모델 생성

자신만의 fine-tuned 모델을 사용하려면:

1. Modelfile 생성:
   ```
   FROM deepseek-coder:6.7b
   SYSTEM "당신은 [회사명]의 코딩 스타일 가이드를 따르는 전문가입니다."
   ```

2. 모델 빌드:
   ```bash
   ollama create my-custom-model -f Modelfile
   ```

3. 설정에서 모델 변경:
   ```json
   "opencopilot.model": "my-custom-model"
   ```

## 🤝 기여하기

오픈소스 프로젝트입니다! 기여를 환영합니다:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자유롭게 사용, 수정, 배포할 수 있습니다.

## 🙏 감사의 말

- [Ollama](https://ollama.ai) - 로컬 LLM 실행
- [DeepSeek](https://github.com/deepseek-ai) - 뛰어난 코딩 모델
- [Meta](https://github.com/facebookresearch/codellama) - CodeLlama 모델
- VSCode 팀 - 훌륭한 Extension API

## 📞 지원

문제가 발생하거나 제안사항이 있으면:
- GitHub Issues로 문제 제기
- 또는 직접 코드를 수정하여 사용

---

**완전히 오픈소스이고, 완전히 무료이며, 완전히 당신의 것입니다.** 🚀
