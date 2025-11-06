@echo off
title Keyboard Training Application Launcher

echo ==================================
echo   Welcome to Keyboard Training Application
echo ==================================
echo Checking system environment...

REM Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Node.js not detected
    echo Please install Node.js before running this program
    echo Visit https://nodejs.org/ to download and install Node.js
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✓ Node.js installed (%NODE_VERSION%)
)

REM Check npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: npm not detected
    echo Please ensure Node.js is properly installed
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
    echo ✓ npm installed (%NPM_VERSION%)
)

REM Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Python not detected
    echo Please install Python before running this program
    echo Visit https://www.python.org/downloads/ to download and install Python
    echo Make sure to check "Add Python to PATH" option during installation
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo ✓ Python installed (%PYTHON_VERSION%)
)

echo.
echo Installing project dependencies...

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Frontend dependencies installation failed
        cd ..
        pause
        exit /b 1
    )
    echo ✓ Frontend dependencies installed successfully
) else (
    echo ✓ Frontend dependencies already exist
)
cd ..

REM Install backend dependencies
echo Installing backend dependencies...
cd python_light_server
python -c "import flask" >nul 2>nul
if %errorlevel% neq 0 (
    pip install flask
    if %errorlevel% neq 0 (
        echo ❌ Flask installation failed
        cd ..
        pause
        exit /b 1
    )
    echo ✓ Flask installed successfully
) else (
    echo ✓ Flask already installed
)
cd ..

REM Install root directory dependencies
echo Installing root directory dependencies...
if not exist "node_modules" (
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Root directory dependencies installation failed
        pause
        exit /b 1
    )
    echo ✓ Root directory dependencies installed successfully
) else (
    echo ✓ Root directory dependencies already exist
)

echo.
echo ==================================
echo   Starting Application
echo ==================================

REM Start backend Flask server (in background)
echo Starting backend server (port 5050)...
cd python_light_server
start "Backend Server" /min python light_server.py
cd ..

REM Wait for backend server to start
timeout /t 5 /nobreak >nul

echo ✓ Backend server started
echo.

echo Starting frontend development server (port 3000)...
echo Once started, the application will automatically open in your browser
echo If the browser doesn't open automatically, please visit http://localhost:3000 manually
echo ==================================
echo.
echo Press any key to stop the application...
echo.

REM Start frontend React application
npm start

echo.
echo Stopping backend server...
taskkill /f /im python.exe >nul 2>nul

echo.
echo Application closed, thank you for using!
pause