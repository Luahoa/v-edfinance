@echo off
:: Chuyển thư mục làm việc về thư mục chứa file .bat này
cd /d "%~dp0"

echo ==========================================
echo DANG CAI DAT DU AN LUA HOA EDTECH
echo Thu muc hien tai: %cd%
echo ==========================================

echo [1/4] Dang cai dat dependencies cho monorepo...
call npm install --legacy-peer-deps

echo [1.5/4] Cuong che cai dat React cho Web...
cd apps\web
call npm install react react-dom next --legacy-peer-deps
cd ..\..

echo [2/4] Dang tao Prisma Client cho API...
cd apps\api
call npx prisma generate

echo [3/4] Dang kiem tra build cho Web...
cd ..\web
call npm run build

echo [4/4] Hoan tat! 
echo Bay gio ban co the chay lenh 'npm run dev' o thu muc goc de bat dau trai nghiem.
pause
