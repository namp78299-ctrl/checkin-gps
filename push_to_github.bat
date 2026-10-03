@echo off
chcp 65001 >nul
title Đẩy Code Lên GitHub
cd /d "%~dp0"

echo ========================================================
echo       ĐANG ĐẨY CODE LÊN GITHUB: checkin-gps
echo ========================================================
echo.

echo [1/3] Đóng gói các file mã nguồn...
git add .
git commit -m "Deploy checkin app to Render" 2>nul

echo [2/3] Cấu hình remote GitHub...
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/namp78299-ctrl/checkin-gps.git

echo [3/3] Đang tải code lên GitHub (vui lòng bấm 'Sign in' nếu có popup)...
git push -u origin main

echo.
echo ========================================================
if %errorlevel% equ 0 (
    echo  THÀNH CÔNG! Code đã được tải lên GitHub hoàn tất.
    echo  Bây giờ bạn dán link sau vào trang Render:
    echo.
    echo  https://github.com/namp78299-ctrl/checkin-gps
    echo ========================================================
) else (
    echo  [LƯU Ý] Nếu chưa đăng nhập GitHub, vui lòng đăng nhập trên popup trình duyệt và thử lại.
    echo ========================================================
)
pause
