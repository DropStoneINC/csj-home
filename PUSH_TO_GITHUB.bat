@echo off
chcp 65001 >nul
echo ============================================
echo   Cyber Shield Agent PWA - GitHub Push
echo ============================================
echo.

REM 現在のフォルダでgit初期化
cd /d "%~dp0"

echo [1/6] git init...
git init

echo [2/6] git remote 設定...
git remote add origin https://github.com/DropStoneINC/csj-home.git 2>nul
git remote set-url origin https://github.com/DropStoneINC/csj-home.git

echo [3/6] ファイルをステージング...
git add -A

echo [4/6] コミット作成...
git commit -m "feat: Cyber Shield Agent PWA - full 14-page app with Supabase backend"

echo [5/6] ブランチ設定...
git branch -M main

echo [6/6] GitHubにpush...
git push -u origin main --force

echo.
echo ============================================
echo   Push完了！
echo   https://github.com/DropStoneINC/csj-home
echo ============================================
echo.
pause
