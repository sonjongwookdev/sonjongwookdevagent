#!/usr/bin/env powershell
# GitHub 저장소 생성 및 업로드 자동화 스크립트
# 손종욱 님 전용

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  손종욱 AI 비서 GitHub 배포 자동화" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 0. GitHub CLI 설치 확인 및 설치
Write-Host "[0/5] GitHub CLI 확인..." -ForegroundColor Yellow
$ghInstalled = $null -ne (Get-Command gh -ErrorAction SilentlyContinue)

if (-not $ghInstalled) {
    Write-Host "  ⚠ GitHub CLI가 설치되지 않았습니다. 설치 중..." -ForegroundColor Magenta
    
    # winget 또는 choco로 설치 시도
    try {
        Write-Host "  👉 winget으로 설치 시도..." -ForegroundColor Cyan
        winget install --id GitHub.cli -e --accept-source-agreements | Out-Null
        Write-Host "  ✓ GitHub CLI 설치 완료" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠ GitHub CLI 자동 설치 실패" -ForegroundColor Yellow
        Write-Host "  📖 https://cli.github.com/manual/installation 에서 수동 설치하세요" -ForegroundColor White
        exit 1
    }
}
else {
    Write-Host "  ✓ GitHub CLI 이미 설치됨" -ForegroundColor Green
}

# 1. GitHub 인증
Write-Host "`n[1/5] GitHub 인증..." -ForegroundColor Yellow
$authCheck = gh auth status 2>&1
if ($authCheck -like "*Logged in to*") {
    Write-Host "  ✓ GitHub에 이미 로그인됨" -ForegroundColor Green
}
else {
    Write-Host "  👉 GitHub 로그인이 필요합니다..." -ForegroundColor Cyan
    Write-Host "  📱 브라우저에서 GitHub 계정으로 인증하세요" -ForegroundColor Cyan
    gh auth login --web
    Write-Host "  ✓ 인증 완료" -ForegroundColor Green
}

# 2. Git 설정
Write-Host "`n[2/5] Git 설정..." -ForegroundColor Yellow
git config --global user.name "Sonjongwook"
git config --global user.email "sonjongwookdev@gmail.com"
Write-Host "  ✓ Git 설정 완료 (sonjongwookdev@gmail.com)" -ForegroundColor Green

# 3. GitHub 저장소 생성
Write-Host "`n[3/5] GitHub 저장소 생성..." -ForegroundColor Yellow
$REPO_NAME = "sonjongwookdevagent"
$REPO_DESC = "손종욱 전용 AI 코딩 비서 - Ollama기반 VSCode Extension"

# 저장소 생성 여부 확인
$repoExists = gh repo view sonjongwookdev/$REPO_NAME 2>$null
if ($null -ne $repoExists) {
    Write-Host "  ✓ 저장소 이미 존재 ($REPO_NAME)" -ForegroundColor Green
}
else {
    Write-Host "  📝 새 저장소 생성 중 ($REPO_NAME)..." -ForegroundColor Cyan
    gh repo create $REPO_NAME `
        --description $REPO_DESC `
        --public `
        --source=. `
        --remote=origin `
        --push
    Write-Host "  ✓ 저장소 생성 및 초기 푸시 완료" -ForegroundColor Green
}

# 4. Git 초기화 및 커밋 (이미 푸시된 경우 스킵)
Write-Host "`n[4/5] Git 저장소 초기화 및 커밋..." -ForegroundColor Yellow
cd C:\customagent

if (-not (Test-Path .git)) {
    Write-Host "  📝 Git 초기화 중..." -ForegroundColor Cyan
    git init
    git add .
    git commit -m "initial commit: 손종욱 전용 AI 코딩 비서 v1.0 - Ollama기반 VSCode Extension"
    Write-Host "  ✓ Git 초기화 및 커밋 완료" -ForegroundColor Green
}
else {
    Write-Host "  ✓ Git 저장소 이미 초기화됨" -ForegroundColor Green
}

# 5. GitHub 푸시
Write-Host "`n[5/5] GitHub에 업로드..." -ForegroundColor Yellow
git branch -M main 2>$null
git remote remove origin 2>$null
git remote add origin "https://github.com/sonjongwookdev/$REPO_NAME.git"
git push -u origin main --force

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ GitHub 배포 완료!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "📊 저장소 정보:" -ForegroundColor Cyan
Write-Host "  🔗 URL: https://github.com/sonjongwookdev/$REPO_NAME" -ForegroundColor White
Write-Host "  📝 설명: $REPO_DESC" -ForegroundColor White
Write-Host "  👤 소유자: sonjongwookdev@gmail.com" -ForegroundColor White

Write-Host "`n💡 다음 단계:" -ForegroundColor Cyan
Write-Host "  1️⃣ GitHub 저장소 방문: https://github.com/sonjongwookdev/$REPO_NAME" -ForegroundColor White
Write-Host "  2️⃣ 모든 파일이 업로드되었는지 확인" -ForegroundColor White
Write-Host "  3️⃣ (선택) GitHub Releases 생성" -ForegroundColor White
Write-Host "  4️⃣ (선택) VSCode Marketplace에 등록" -ForegroundColor White

Write-Host "`n🎉 축하합니다! 손종욱 전용 AI 코딩 비서가 GitHub에 공개되었습니다!`n" -ForegroundColor Green
