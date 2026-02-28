# Open Copilot 예제 및 사용 시나리오

## 예제 1: 코드 리팩토링

**이전 코드:**
```javascript
function calc(a, b, op) {
    if (op == '+') {
        return a + b;
    } else if (op == '-') {
        return a - b;
    } else if (op == '*') {
        return a * b;
    } else if (op == '/') {
        return a / b;
    }
}
```

**작업:**
1. 위 코드 선택
2. 우클릭 → "Open Copilot" → "코드 리팩토링"

**AI가 생성한 코드:**
```javascript
/**
 * 두 숫자에 대해 지정된 연산을 수행합니다.
 * @param {number} a - 첫 번째 피연산자
 * @param {number} b - 두 번째 피연산자
 * @param {string} op - 연산자 (+, -, *, /)
 * @returns {number} 연산 결과
 * @throws {Error} 지원하지 않는 연산자인 경우
 */
function calculate(a, b, operation) {
    const operations = {
        '+': (x, y) => x + y,
        '-': (x, y) => x - y,
        '*': (x, y) => x * y,
        '/': (x, y) => {
            if (y === 0) throw new Error('0으로 나눌 수 없습니다');
            return x / y;
        }
    };

    if (!operations[operation]) {
        throw new Error(`지원하지 않는 연산자: ${operation}`);
    }

    return operations[operation](a, b);
}
```

## 예제 2: 버그 수정

**버그가 있는 코드:**
```python
def find_max(numbers):
    max = 0
    for num in numbers:
        if num > max:
            max = num
    return max

# 문제: 음수만 있는 리스트에서 0을 반환
print(find_max([-5, -2, -10]))  # 기대: -2, 실제: 0
```

**작업:**
1. 코드 선택
2. 우클릭 → "Open Copilot" → "코드 수정"

**AI가 수정한 코드:**
```python
def find_max(numbers):
    """
    리스트에서 최대값을 찾습니다.
    
    Args:
        numbers: 숫자 리스트
        
    Returns:
        최대값
        
    Raises:
        ValueError: 빈 리스트인 경우
    """
    if not numbers:
        raise ValueError("빈 리스트에서는 최대값을 찾을 수 없습니다")
    
    max_value = numbers[0]  # 첫 번째 요소로 초기화
    for num in numbers[1:]:
        if num > max_value:
            max_value = num
    return max_value

print(find_max([-5, -2, -10]))  # -2
```

## 예제 3: 테스트 생성

**원본 함수:**
```typescript
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
```

**작업:**
1. 함수 선택
2. 우클릭 → "Open Copilot" → "테스트 생성"

**AI가 생성한 테스트:**
```typescript
import { validateEmail } from './email-validator';

describe('validateEmail', () => {
    it('유효한 이메일을 올바르게 검증해야 함', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('user.name@domain.co.kr')).toBe(true);
        expect(validateEmail('valid+email@test.org')).toBe(true);
    });

    it('잘못된 이메일을 거부해야 함', () => {
        expect(validateEmail('invalid')).toBe(false);
        expect(validateEmail('missing@domain')).toBe(false);
        expect(validateEmail('@nodomain.com')).toBe(false);
        expect(validateEmail('spaces in@email.com')).toBe(false);
    });

    it('빈 문자열을 거부해야 함', () => {
        expect(validateEmail('')).toBe(false);
    });

    it('특수 케이스를 처리해야 함', () => {
        expect(validateEmail('email@sub.domain.com')).toBe(true);
        expect(validateEmail('first.last@example.com')).toBe(true);
    });
});
```

## 예제 4: AI 채팅으로 복잡한 알고리즘 구현

**채팅 프롬프트:**
```
"이진 트리에서 두 노드 사이의 최단 경로를 찾는 알고리즘을 TypeScript로 구현해줘. 노드는 value와 left, right 자식을 가지고 있어."
```

**AI 응답:**
```typescript
interface TreeNode {
    value: number;
    left?: TreeNode;
    right?: TreeNode;
}

/**
 * 두 노드 사이의 최단 경로를 찾습니다.
 */
function findPath(
    root: TreeNode | undefined,
    node1: number,
    node2: number
): number[] | null {
    // 각 노드까지의 경로 찾기
    const path1: number[] = [];
    const path2: number[] = [];
    
    if (!findPathToNode(root, node1, path1) || 
        !findPathToNode(root, node2, path2)) {
        return null; // 노드를 찾을 수 없음
    }
    
    // 공통 조상 찾기
    let i = 0;
    while (i < path1.length && i < path2.length && 
           path1[i] === path2[i]) {
        i++;
    }
    
    // 최단 경로 구성
    const shortestPath = [
        ...path1.slice(i - 1),
        ...path2.slice(i).reverse()
    ];
    
    return shortestPath;
}

function findPathToNode(
    node: TreeNode | undefined,
    target: number,
    path: number[]
): boolean {
    if (!node) return false;
    
    path.push(node.value);
    
    if (node.value === target) return true;
    
    if (findPathToNode(node.left, target, path) || 
        findPathToNode(node.right, target, path)) {
        return true;
    }
    
    path.pop(); // 백트래킹
    return false;
}

// 사용 예제
const tree: TreeNode = {
    value: 1,
    left: {
        value: 2,
        left: { value: 4 },
        right: { value: 5 }
    },
    right: {
        value: 3,
        left: { value: 6 },
        right: { value: 7 }
    }
};

console.log(findPath(tree, 4, 7)); // [4, 2, 1, 3, 7]
```

## 예제 5: 인라인 완성

**타이핑 중:**
```python
def fibonacci(n):
    """피보나치 수열의 n번째 값을 반환"""
    # [커서 위치]
```

**AI가 자동 제안:**
```python
    if n <= 0:
        return 0
    elif n == 1:
        return 1
    else:
        return fibonacci(n - 1) + fibonacci(n - 2)
```

**Tab 키를 누르면 자동으로 삽입됨**

## 예제 6: 코드 설명

**선택한 코드:**
```javascript
const memoize = (fn) => {
    const cache = {};
    return (...args) => {
        const key = JSON.stringify(args);
        if (key in cache) return cache[key];
        return cache[key] = fn(...args);
    };
};
```

**Ctrl+Shift+E 누르면 채팅에 표시:**

```
이 코드는 메모이제이션(Memoization) 패턴을 구현한 고차 함수입니다.

**동작 방식:**

1. **캐시 객체 생성**: 함수 실행 결과를 저장할 빈 객체를 만듭니다.

2. **새 함수 반환**: 원본 함수를 감싸는 새로운 함수를 반환합니다.

3. **인자 직렬화**: 함수에 전달된 인자들을 JSON 문자열로 변환하여 캐시 키로 사용합니다.

4. **캐시 확인**: 
   - 같은 인자로 이전에 호출된 적이 있으면 캐시된 결과를 즉시 반환
   - 없으면 원본 함수를 실행하고 결과를 캐시에 저장한 후 반환

**사용 예제:**
```javascript
const slowFibonacci = (n) => {
    if (n <= 1) return n;
    return slowFibonacci(n - 1) + slowFibonacci(n - 2);
};

const fastFibonacci = memoize(slowFibonacci);
console.log(fastFibonacci(40)); // 훨씬 빠름!
```

**장점:**
- 반복적인 계산을 피하여 성능 향상
- 순수 함수에 적용하기 좋음

**주의사항:**
- 메모리 사용량 증가
- 객체나 배열 인자의 경우 참조가 아닌 값으로 비교
```

## 추가 팁

### 효과적인 프롬프트 작성

**나쁜 예:**
```
"코드 고쳐줘"
```

**좋은 예:**
```
"이 Python 함수의 시간 복잡도를 O(n^2)에서 O(n log n)으로 개선해줘. 
해시맵을 사용하는 방법이 있을까?"
```

### 컨텍스트 제공

코드를 선택하면 AI가 자동으로 다음 정보를 활용합니다:
- 파일 이름 및 언어
- 선택된 코드
- 현재 에러/경고
- 주변 코드 (필요시)

### 반복 개선

AI의 첫 응답이 완벽하지 않으면:
1. "더 구체적으로 설명해줘"
2. "에러 처리를 추가해줘"
3. "타입 안정성을 개선해줘"

등의 후속 질문으로 계속 개선할 수 있습니다.
