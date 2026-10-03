@echo off
chcp 65001 >nul
title Đẩy Code Lên GitHub Tự Động
cd /d "%~dp0"

echo ========================================================
echo          ĐẨY CODE TỪ MÁY LÊN GITHUB ĐỂ DEPLOY RENDER
echo ========================================================
echo.
echo Bước này sẽ đưa toàn bộ mã nguồn lên tài khoản GitHub của bạn.
echo.
set /p REPO_URL="Dán đường link GitHub Repository của bạn vào đây: "

if "%REPO_URL%"=="" (
    echo [LỖI] Bạn chưa nhập đường link GitHub!
    pause
    exit /b 1
)

echo.
echo [1/4] Khởi tạo Git...
git init

echo [2/4] Đóng gói các file mã nguồn...
git add .
git commit -m "Deploy checkin app to Render"

echo [3/4] Cấu hình nhánh main...
git branch -M main

echo [4/4] Đẩy code lên GitHub...
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git push -u origin main

echo.
echo ========================================================
echo  THÀNH CÔNG! Toàn bộ code đã được tải lên GitHub.
echo  Bây giờ bạn dán link đó vào ô Render là xong!
echo ========================================================
pause
