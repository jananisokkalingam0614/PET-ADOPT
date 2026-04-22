@echo off
title PawsHome
color 0A
cls

cd /d "%~dp0"

:: First time install
if not exist "backend\node_modules" (
    echo Installing... please wait
    cd backend
    call npm install
    cd ..
)

:: Kill old processes
taskkill /F /IM node.exe >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 2^>nul') do taskkill /F /PID %%a >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start MongoDB
start "MongoDB" /min cmd /k "mongod"
timeout /t 3 /nobreak >nul

:: Reset passwords and seed
cd backend
node -e "require('dotenv').config();const mongoose=require('mongoose');const bcrypt=require('bcryptjs');const User=require('./models/User');mongoose.connect(process.env.MONGO_URI||'mongodb://localhost:27017/pawshome').then(async()=>{try{const h1=await bcrypt.hash('admin123',10);const h2=await bcrypt.hash('password123',10);await User.updateOne({email:'admin@pawshome.com'},{password:h1});await User.updateOne({email:'sarah@example.com'},{password:h2});}catch(e){}process.exit();}).catch(()=>process.exit())" >nul 2>&1

:: Start Server
start "PawsHome Server" /min cmd /k "cd /d "%~dp0backend" && npm run dev"
cd ..
timeout /t 4 /nobreak >nul

:: Open Browser
start http://localhost:4000
cls

:MENU
echo.
echo  ================================
echo       PawsHome is RUNNING
echo  ================================
echo   http://localhost:4000
echo  --------------------------------
echo   ADMIN : admin@pawshome.com
echo           admin123
echo   USER  : sarah@example.com
echo           password123
echo  ================================
echo.
echo   [1] Open Website
echo   [2] Seed Sample Data
echo   [3] Export to Excel
echo   [4] Exit
echo.
set /p choice="Choice: "

if "%choice%"=="1" start http://localhost:4000 & goto MENU
if "%choice%"=="2" cd backend & node seed.js & cd .. & goto MENU
if "%choice%"=="3" cd backend & node export.js & cd .. & pause & goto MENU
if "%choice%"=="4" goto EXIT
goto MENU

:EXIT
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM mongod.exe >nul 2>&1
exit
