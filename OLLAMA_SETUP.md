# Ollama 설치 및 설정 가이드

## Windows 설치

### 방법 1: 공식 인스톨러 (추천)

1. https://ollama.ai/download 방문
2. "Download for Windows" 클릭
3. 다운로드한 `OllamaSetup.exe` 실행
4. 설치 마법사 따라하기

### 방법 2: winget (Windows Package Manager)

```powershell
winget install Ollama.Ollama
```

## 설치 확인

```powershell
# PowerShell에서 실행
ollama --version

# Ollama 서비스 시작 (자동 시작되지 않은 경우)
ollama serve
```

## 추천 모델 다운로드

### 코딩용 모델

#### DeepSeek Coder (가장 추천)
```powershell
# 6.7B 모델 - 균형잡힌 성능과 품질
ollama pull deepseek-coder:6.7b

# 33B 모델 - 최고 품질 (고성능 PC 필요)
ollama pull deepseek-coder:33b

# 1.3B 모델 - 빠른 응답 (저사양 PC용)
ollama pull deepseek-coder:1.3b
```

#### CodeLlama (Meta)
```powershell
# 7B 코드 전용 모델
ollama pull codellama:7b-code

# 7B 일반 모델
ollama pull codellama:7b

# 13B 모델 (더 나은 품질)
ollama pull codellama:13b
```

#### Mistral (범용)
```powershell
# 7B 모델 - 빠르고 효율적
ollama pull mistral:7b

# Instruct 버전 - 명령 수행에 최적화
ollama pull mistral:7b-instruct
```

#### GLM-4 (Zhipu AI - 다국어 지원)
```powershell
# 9B 모델 - 중국어/영어/코딩 모두 우수
ollama pull glm4:9b

# 추천: 한국어 지원이 좋음
```

## 모델 비교표

| 모델 | 크기 | RAM 필요 | 코딩 성능 | 속도 | 추천 용도 |
|-----|------|---------|----------|-----|---------|
| `deepseek-coder:1.3b` | 1.3GB | 4GB | ⭐⭐⭐ | ⚡⚡⚡ | 저사양 PC, 빠른 완성 |
| `codellama:7b-code` | 2GB | 8GB | ⭐⭐⭐⭐ | ⚡⚡ | 코드 완성 특화 |
| `glm4:9b` | 5GB | 8GB | ⭐⭐⭐⭐⭐ | ⚡⚡ | 다국어, 한국어 우수 |
| `deepseek-coder:6.7b` | 6.7GB | 8GB | ⭐⭐⭐⭐⭐ | ⚡⚡ | **균형잡힌 선택** |
| `codellama:13b` | 7GB | 16GB | ⭐⭐⭐⭐⭐ | ⚡ | 고품질 생성 |
| `deepseek-coder:33b` | 26GB | 32GB | ⭐⭐⭐⭐⭐⭐ | ⚡ | 최고 품질 |

## 모델 관리

### 다운로드한 모델 확인
```powershell
ollama list
```

### 모델 삭제
```powershell
ollama rm deepseek-coder:6.7b
```

### 모델 업데이트
```powershell
ollama pull deepseek-coder:6.7b
```

## Ollama 설정

### 기본 포트 변경

Ollama는 기본적으로 포트 11434를 사용합니다. 변경하려면:

**Windows:**
1. 환경 변수 설정:
   ```powershell
   # 시스템 환경 변수 설정
   [Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:8080", "Machine")
   ```

2. Ollama 서비스 재시작

**또는 VSCode 설정에서:**
```json
{
  "opencopilot.ollamaUrl": "http://localhost:8080"
}
```

### GPU 가속 설정

#### NVIDIA GPU

Ollama는 CUDA를 자동으로 감지합니다:

1. NVIDIA 드라이버 최신 버전 설치
2. CUDA Toolkit 11.8+ 설치 (선택사항)
3. Ollama 재시작

확인:
```powershell
# GPU 사용 여부 확인
nvidia-smi

# Ollama에서 GPU 사용 확인
# 모델 실행 시 로그에 "Using GPU" 표시
```

#### AMD GPU

AMD ROCm 지원 (Linux 전용, Windows는 CPU만 지원)

### 메모리 설정

모델이 사용할 최대 메모리 제한:

```powershell
# 환경 변수 설정 (16GB 제한)
[Environment]::SetEnvironmentVariable("OLLAMA_MAX_LOADED_MODELS", "2", "Machine")
[Environment]::SetEnvironmentVariable("OLLAMA_NUM_PARALLEL", "1", "Machine")
```

## 성능 최적화

### 1. 모델 사전 로딩

자주 사용하는 모델을 미리 메모리에 로드:

```powershell
# 백그라운드에서 모델 로드
ollama run deepseek-coder:6.7b ""
```

### 2. 동시 요청 수 조절

```powershell
[Environment]::SetEnvironmentVariable("OLLAMA_NUM_PARALLEL", "4", "Machine")
```

### 3. Keep-alive 시간 설정

모델을 메모리에 유지하는 시간:

```powershell
# 5분 동안 유지
[Environment]::SetEnvironmentVariable("OLLAMA_KEEP_ALIVE", "5m", "Machine")

# 항상 유지
[Environment]::SetEnvironmentVariable("OLLAMA_KEEP_ALIVE", "-1", "Machine")
```

## 문제 해결

### Ollama가 시작되지 않음

1. **서비스 확인:**
   ```powershell
   Get-Service Ollama
   ```

2. **수동 시작:**
   ```powershell
   Start-Service Ollama
   # 또는
   ollama serve
   ```

3. **포트 충돌 확인:**
   ```powershell
   netstat -ano | findstr :11434
   ```

### 모델 다운로드 실패

1. **인터넷 연결 확인**

2. **디스크 공간 확인:**
   ```powershell
   Get-PSDrive C | Select-Object Used,Free
   ```

3. **프록시 설정 (필요한 경우):**
   ```powershell
   [Environment]::SetEnvironmentVariable("HTTP_PROXY", "http://proxy:port", "Machine")
   [Environment]::SetEnvironmentVariable("HTTPS_PROXY", "http://proxy:port", "Machine")
   ```

### GPU 인식 안 됨

1. **NVIDIA 드라이버 업데이트:**
   - https://www.nvidia.com/Download/index.aspx

2. **CUDA 설치 확인:**
   ```powershell
   nvcc --version
   ```

3. **Ollama 재설치**

### 응답이 너무 느림

1. **더 작은 모델 사용:**
   ```powershell
   ollama pull deepseek-coder:1.3b
   ```

2. **메모리 확인:**
   ```powershell
   Get-Process ollama | Select-Object WorkingSet
   ```

3. **백그라운드 프로세스 종료**

## 고급 설정

### 커스텀 모델 만들기

```powershell
# Modelfile 생성
@"
FROM deepseek-coder:6.7b

SYSTEM """당신은 Python 전문가입니다. PEP 8 스타일 가이드를 엄격히 따릅니다."""

PARAMETER temperature 0.1
PARAMETER top_k 20
PARAMETER top_p 0.9
"@ | Out-File Modelfile -Encoding utf8

# 모델 빌드
ollama create my-python-expert -f Modelfile

# 사용
ollama run my-python-expert
```

### API 직접 호출

```powershell
# REST API 테스트
$body = @{
    model = "deepseek-coder:6.7b"
    prompt = "def fibonacci(n):"
    stream = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:11434/api/generate" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

## VSCode Extension 설정

Open Copilot을 위한 권장 설정:

```json
{
  "opencopilot.ollamaUrl": "http://localhost:11434",
  "opencopilot.model": "deepseek-coder:6.7b",
  "opencopilot.enableInlineCompletion": true,
  "opencopilot.completionDelay": 300,
  "opencopilot.maxTokens": 2000,
  "opencopilot.temperature": 0.2
}
```

### 모델별 추천 설정

**빠른 완성 (저사양 PC):**
```json
{
  "opencopilot.model": "deepseek-coder:1.3b",
  "opencopilot.completionDelay": 200,
  "opencopilot.maxTokens": 500
}
```

**균형잡힌 설정 (추천):**
```json
{
  "opencopilot.model": "deepseek-coder:6.7b",
  "opencopilot.completionDelay": 300,
  "opencopilot.maxTokens": 2000,
  "opencopilot.temperature": 0.2
}
```

**최고 품질 (고성능 PC):**
```json
{
  "opencopilot.model": "deepseek-coder:33b",
  "opencopilot.completionDelay": 500,
  "opencopilot.maxTokens": 4000,
  "opencopilot.temperature": 0.1
}
```

**다국어 지원 (한국어 우수):**
```json
{
  "opencopilot.model": "glm4:9b",
  "opencopilot.completionDelay": 300,
  "opencopilot.maxTokens": 2000,
  "opencopilot.temperature": 0.2
}
```

## 추가 자원

- **Ollama 공식 문서:** https://github.com/ollama/ollama
- **모델 라이브러리:** https://ollama.ai/library
- **Discord 커뮤니티:** https://discord.gg/ollama
- **GitHub Issues:** https://github.com/ollama/ollama/issues

## 다음 단계

1. ✅ Ollama 설치 완료
2. ✅ 모델 다운로드 완료
3. 📝 Open Copilot Extension 설치
4. 🚀 F5 키를 눌러 Extension Development Host 실행
5. 💡 Ctrl+Shift+L로 채팅 시작!
