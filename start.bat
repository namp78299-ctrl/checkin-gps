@echo off
chcp 65001 >nul
title Hệ Thống Check-in & Định Vị GPS Realtime
cd /d "%~dp0"

echo ========================================================
echo       HỆ THỐNG CHECK-IN & XÁC THỰC VỊ TRÍ GPS REALTIME
echo ========================================================
echo.

:: Kiểm tra Node.js đã được cài đặt chưa
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Máy tính chưa cài đặt Node.js!
    echo Vui lòng tải và cài đặt tại: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Kiểm tra và cài đặt thư viện nếu chưa có
if not exist "node_modules\" (
    echo [1/2] Đang cài đặt thư viện cần thiết (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [LỖI] Không thể cài đặt thư viện! Vui lòng kiểm tra kết nối mạng.
        pause
        exit /b 1
    )
)

echo [2/2] Đang khởi động Server và tạo link HTTPS chia sẻ tự động...
echo.
echo - Trang Quản Trị (Admin): http://localhost:3000/admin
echo.
echo Nhấn Ctrl + C để dừng máy chủ bất kỳ lúc nào.
echo ========================================================
echo.

:: Tự động mở trang Quản trị Admin trên trình duyệt sau 4 giây (chờ Cloudflare sẵn sàng)
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000/admin"

:: Khởi chạy server: Tự động chạy nội bộ + Tự động tạo link HTTPS công khai
node server.js

pause
