@echo off
cd /d "%~dp0"
echo ========================================================
echo   DANG DONG BO CODE LEN GITHUB: checkin-gps
echo ========================================================
echo.
git add .
git commit -m "Deploy checkin app to Render"
git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/namp78299-ctrl/checkin-gps.git
echo.
echo Dang day code len GitHub...
echo (Neu co cua so GitHub bat len, vui long bam 'Sign in with your browser')
echo.
git push -u origin main
echo.
echo ========================================================
echo Hoan tat! Hay quay lai trang Render va bam Manual Deploy.
echo ========================================================
pause
