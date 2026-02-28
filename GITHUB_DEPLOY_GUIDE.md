# 🚀 GitHub 배포 가이드

## ✅ 사전 준비

### 1. PowerShell 관리자 권한으로 실행
- **Windows 키** + R 누르기
- `powershell` 입력
- **Ctrl+Shift+Enter** (관리자로 실행)

### 2. Git 설치 확인
```powershell
git --version
```

## 📋 단계별 배포 process

### Step 1: GitHub에 빈 저장소 생성

1. **https://github.com/new** 방문
2. 다음 정보 입력:
   - **Repository name:** `sonjongwookdevagent`
   - **Description:** `손종욱 전용 AI 코딩 비서 - Ollama기반 VSCode Extension`
   - **Public 또는 Private 선택**
   - **"Create repository" 클릭**

⚠️ **중요:** "Initialize with README" 체크하지 말기!

### Step 2: 배포 스크립트 실행

PowerShell에서:

```powershell
# 실행 정책 일시 변경
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# 스크립트 실행
C:\customagent\github-deploy.ps1
```

### Step 3: GitHub 인증

첫 푸시 시 인증 창이 뜹니다:

#### 방법 A: GitHub 로그인 (간단)
- GitHub 계정 선택
- 승인

#### 방법 B: Personal Access Token (안전)

1. https://github.com/settings/tokens 방문
2. **"Generate new token"** 클릭 
3. **"Tokens (classic)" 선택**
4. **Token name:** `sonjongwookdevagent-deployment`
5. **Expiration:** 90 days
6. **Select scopes:** `repo` 체크
7. **"Generate token" 클릭**
8. **토큰 복사**
9. PowerShell에서 인증 창이 뜰 때:
   - Username: `sonjongwookdev`
   - Password: **복사한 토큰 붙여넣기**

## 🎯 완료 후 확인

### GitHub 저장소 확인
```
https://github.com/sonjongwookdev/sonjongwookdevagent
```

### 저장소의 다음 파일들이 보여야 함:
- ✅ `package.json`
- ✅ `src/` 폴더
- ✅ `README.md`
- ✅ `.gitignore`
- ✅ `LICENSE`
- ✅ 기타 파일들

### 확인 명령어
```powershell
cd C:\customagent

# 원격 저장소 확인
git remote -v

# 커밋 히스토리 확인
git log

# GitHub에 업로드된 파일 확인
git ls-remote origin
```

## 🛠️ 트러블슈팅

### "저장소를 찾을 수 없음" 에러
```
❌ fatal: repository not found
```
**해결:**
1. GitHub에 저장소가 생성되었는지 확인
2. 저장소명이 정확한지 확인 (`sonjongwookdevagent`)
3. GitHub 계정이 맞는지 확인

### 인증 실패
```
❌ fatal: Authentication failed
```
**해결:**
1. GitHub 계정 정보 확인
2. 비밀번호 또는 토큰 재입력
3. 2FA(2단계 인증) 활성화된 경우 토큰 사용 필수

### Git 설정 확인
```powershell
git config --global user.name
git config --global user.email
```

## 📊 배포 후 다음 단계

### 1️⃣ VSCode Extension 마켓플레이스 등록
```powershell
npm install -g @vscode/vsce
vsce publish
```

### 2️⃣ GitHub Releases 생성
1. GitHub 저장소 방문
2. **Releases** 탭 클릭
3. **"Create a new release"** 클릭
4. Tag: `v1.0.0`
5. Title: `v1.0.0 - Initial Release`
6. Description: 주요 기능 설명

### 3️⃣ Stars 받기
- GitHub에서 ⭐ 받을 수 있도록 README 작성
- 한국 개발자 커뮤니티에 공유

## ✨ 완료!

```
✅ 손종욱 전용 AI 코딩 비서가 GitHub에 배포됨
📊 https://github.com/sonjongwookdev/sonjongwookdevagent
🌟 공개된 오픈소스 프로젝트
💾 전체 코드 공개
📖 완벽한 문서화
```

**축하합니다!** 🎉
