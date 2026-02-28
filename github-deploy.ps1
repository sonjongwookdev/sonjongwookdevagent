# GitHub 배포 스크립트
$GITHUB_USERNAME = "sonjongwookdev"
$PROJECT_NAME = "sonjongwookdevagent"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "손종욱 AI 비서 GitHub 배포 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. 현재 디렉토리 이동
Write-Host "`n[1/5] 디렉토리 이동..." -ForegroundColor Yellow
cd C:\customagent

# 2. Git 초기화
Write-Host "[2/5] Git 초기화..." -ForegroundColor Yellow
if (Test-Path .git) {
    Write-Host "  ✓ 이미 Git 저장소가 있습니다" -ForegroundColor Green
} else {
    git init
    Write-Host "  ✓ Git 초기화 완료" -ForegroundColor Green
}

# 3. 파일 추가
Write-Host "`n[3/5] 파일 추가..." -ForegroundColor Yellow
git add .
Write-Host "  ✓ 모든 파일 추가 완료" -ForegroundColor Green

# 4. 커밋
Write-Host "`n[4/5] 커밋 작성..." -ForegroundColor Yellow
git commit -m "initial commit: 손종욱 전용 AI 코딩 비서 v1.0 - Ollama기반 VSCode Extension"
Write-Host "  ✓ 커밋 완료" -ForegroundColor Green

# 5. GitHub 저장소 추가 및 푸시
Write-Host "`n[5/5] GitHub에 연결 및 업로드..." -ForegroundColor Yellow

$REPO_URL = "https://github.com/$GITHUB_USERNAME/$PROJECT_NAME.git"

# 원격 저장소 확인
$current_remote = git remote -v 2>$null | Select-String "origin"
if ($current_remote) {
    Write-Host "  기존 원격 저장소 제거..." -ForegroundColor Cyan
    git remote remove origin
}

Write-Host "  GitHub 저장소 추가: $REPO_URL" -ForegroundColor Cyan
git remote add origin $REPO_URL

Write-Host "  브랜치 설정..." -ForegroundColor Cyan
git branch -M main

Write-Host "  GitHub에 업로드 중..." -ForegroundColor Cyan
git push -u origin main

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ GitHub 업로드 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`n📊 저장소 주소:" -ForegroundColor Cyan
Write-Host "📌 https://github.com/$GITHUB_USERNAME/$PROJECT_NAME" -ForegroundColor White
Write-Host "`n💡 다음 단계:" -ForegroundColor Cyan
Write-Host "  1. GitHub 저장소 확인" -ForegroundColor White
Write-Host "  2. README.md 확인" -ForegroundColor White
Write-Host "  3. 필요시 설정 수정" -ForegroundColor White
