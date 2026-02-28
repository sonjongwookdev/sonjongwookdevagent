# GLM-4 모델 사용 가이드

## GLM-4란?

**GLM-4**는 Zhipu AI에서 개발한 대형 언어 모델로, 특히 **중국어와 한국어를 포함한 다국어 지원**이 우수합니다.

### 주요 특징

✅ **다국어 지원** - 영어, 중국어, 한국어, 일본어 등 다양한 언어  
✅ **코딩 능력** - 프로그래밍 작업에도 뛰어남  
✅ **추론 능력** - 복잡한 논리적 사고  
✅ **균형잡힌 성능** - 9B 파라미터로 효율적

## 설치 방법

### 1. Ollama 설치
```powershell
# Windows: https://ollama.ai/download에서 다운로드
```

### 2. GLM-4 모델 다운로드
```powershell
# GLM-4 9B 모델 (약 5GB)
ollama pull glm4:9b

# 모델 확인
ollama list
```

### 3. Open Copilot 설정

VSCode 설정 (`Ctrl+,`)에서:

```json
{
  "opencopilot.model": "glm4:9b",
  "opencopilot.ollamaUrl": "http://localhost:11434",
  "opencopilot.enableInlineCompletion": true,
  "opencopilot.temperature": 0.2
}
```

## GLM-4 vs DeepSeek Coder

| 특성 | GLM-4 (9B) | DeepSeek Coder (6.7B) |
|-----|-----------|----------------------|
| **언어 지원** | 다국어 (한국어 우수) | 주로 영어/코드 |
| **코딩 성능** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐⭐ |
| **한국어 응답** | ⭐⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **모델 크기** | 5GB | 6.7GB |
| **추론 속도** | 빠름 | 보통 |
| **RAM 요구** | 8GB+ | 8GB+ |
| **추천 용도** | 다국어 프로젝트, 한국어 문서화 | 순수 코딩 작업 |

## 사용 시나리오

### GLM-4가 더 좋은 경우

1. **한국어 주석/문서가 필요할 때**
   ```python
   # GLM-4가 생성한 한국어 주석
   def calculate_total(items):
       """
       아이템 리스트의 총합을 계산합니다.
       
       매개변수:
           items (list): 숫자 리스트
           
       반환값:
           float: 모든 아이템의 합계
       """
       return sum(items)
   ```

2. **다국어 프로젝트**
   - 한국어, 중국어, 일본어 코멘트가 섞인 코드
   - 국제화(i18n) 작업

3. **한국어로 코딩 질문**
   ```
   "이 함수를 한국어로 자세히 설명해줘"
   "이 에러 메시지가 무슨 의미인지 한국어로 알려줘"
   ```

### DeepSeek Coder가 더 좋은 경우

1. **순수 코딩 작업**
   - 알고리즘 구현
   - 복잡한 로직
   - 성능 최적화

2. **영어 코멘트 선호**
   - 국제 팀 프로젝트
   - 오픈소스 기여

3. **코드 완성 속도 중시**

## 실전 예제

### 예제 1: 한국어 문서 생성

**프롬프트:**
```
다음 TypeScript 함수에 대한 한국어 JSDoc을 생성해줘:

function validateUser(user: User): boolean {
    return user.age >= 18 && user.email.includes('@');
}
```

**GLM-4 응답:**
```typescript
/**
 * 사용자 정보의 유효성을 검증합니다.
 * 
 * @param {User} user - 검증할 사용자 객체
 * @returns {boolean} 사용자가 유효하면 true, 그렇지 않으면 false
 * 
 * @description
 * 이 함수는 다음 조건을 확인합니다:
 * - 사용자의 나이가 18세 이상인지
 * - 이메일 주소에 '@' 기호가 포함되어 있는지
 * 
 * @example
 * const user = { age: 20, email: 'test@example.com' };
 * const isValid = validateUser(user); // true
 */
function validateUser(user: User): boolean {
    return user.age >= 18 && user.email.includes('@');
}
```

### 예제 2: 에러 메시지 한국어 설명

**프롬프트:**
```
이 에러를 한국어로 설명하고 해결 방법을 알려줘:

TypeError: Cannot read property 'length' of undefined
```

**GLM-4 응답:**
```
# 에러 분석

**에러 유형:** TypeError
**의미:** 정의되지 않은(undefined) 값의 'length' 속성을 읽으려고 시도했습니다.

## 발생 원인

1. 변수가 초기화되지 않음
2. 함수가 값을 반환하지 않음
3. 객체 속성이 존재하지 않음

## 해결 방법

```javascript
// 방법 1: Optional Chaining 사용
const length = data?.length ?? 0;

// 방법 2: 조건문으로 확인
if (data && data.length) {
    console.log(data.length);
}

// 방법 3: 기본값 설정
const data = someFunction() || [];
```

## 예방 방법

- TypeScript 사용으로 타입 체크
- 항상 null/undefined 체크
- 함수가 항상 값을 반환하도록 보장
```

### 예제 3: 코드 리뷰 (한국어)

**코드 선택 후 "코드 설명" 실행:**

```javascript
const results = items.map(item => {
    if (item.type == 'A') {
        return item.value * 2;
    } else if (item.type == 'B') {
        return item.value * 3;
    }
    return item.value;
});
```

**GLM-4 피드백:**
```
# 코드 분석

## 현재 코드의 문제점

1. **느슨한 비교 연산자 사용** (`==` 대신 `===` 권장)
2. **반복적인 if-else 구조** (switch문이나 객체 맵핑이 더 깔끔)
3. **매직 넘버** (2, 3이 무엇을 의미하는지 불명확)

## 개선된 코드

```javascript
// 상수로 배율 정의
const MULTIPLIERS = {
    'A': 2,
    'B': 3,
    'default': 1
};

const results = items.map(item => {
    const multiplier = MULTIPLIERS[item.type] ?? MULTIPLIERS.default;
    return item.value * multiplier;
});
```

## 개선 사항

1. ✅ 타입별 배율을 상수로 명확히 정의
2. ✅ 조건문을 객체 조회로 단순화
3. ✅ 새로운 타입 추가가 쉬워짐
4. ✅ 코드 가독성 향상
```

## 성능 비교

### 시스템 요구사항

**최소:**
- RAM: 8GB
- 저장공간: 6GB

**권장:**
- RAM: 16GB
- GPU: NVIDIA (CUDA) 또는 Apple Silicon
- 저장공간: 10GB

### 속도 벤치마크 (대략적)

| 작업 | GLM-4 (9B) | DeepSeek Coder (6.7B) |
|-----|-----------|----------------------|
| 인라인 완성 | ~1-2초 | ~1-2초 |
| 코드 설명 | ~3-5초 | ~2-4초 |
| 리팩토링 | ~5-10초 | ~4-8초 |
| 테스트 생성 | ~10-15초 | ~8-12초 |

*RTX 3060 GPU 기준

## 두 모델 함께 사용하기

상황에 따라 모델을 전환할 수 있습니다:

### 빠른 전환 방법

VSCode 명령 팔레트 (`Ctrl+Shift+P`):
```
Preferences: Open User Settings (JSON)
```

```json
// 한국어 작업 시
{
  "opencopilot.model": "glm4:9b"
}

// 순수 코딩 작업 시
{
  "opencopilot.model": "deepseek-coder:6.7b"
}
```

### Workspace별 설정

프로젝트 폴더의 `.vscode/settings.json`:

```json
// 한국 기업 프로젝트
{
  "opencopilot.model": "glm4:9b"
}

// 오픈소스 프로젝트
{
  "opencopilot.model": "deepseek-coder:6.7b"
}
```

## 문제 해결

### GLM-4 모델을 찾을 수 없음

```powershell
# 모델 리스트 확인
ollama list

# GLM-4가 없으면 다운로드
ollama pull glm4:9b
```

### 한국어 응답이 이상함

Temperature 값을 낮춰보세요:
```json
{
  "opencopilot.temperature": 0.1
}
```

### 응답이 너무 느림

더 작은 모델 사용:
```powershell
# GLM-4의 더 작은 버전이 출시되면
ollama pull glm4:4b  # 예시
```

## 추가 정보

- **GLM-4 GitHub:** https://github.com/THUDM/GLM-4
- **Ollama GLM-4:** https://ollama.ai/library/glm4
- **Zhipu AI:** https://www.zhipuai.cn/

## 결론

GLM-4는 **한국어 지원이 필요하거나 다국어 프로젝트**에서 특히 유용합니다. Open Copilot에서 간단히 설정만 변경하면 사용할 수 있습니다!

```powershell
# 지금 바로 시작하기
ollama pull glm4:9b
```

그리고 VSCode 설정에서:
```json
{
  "opencopilot.model": "glm4:9b"
}
```

Happy Coding with GLM-4! 🚀
