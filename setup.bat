@echo off
REM Installation script for Coach Running Platform on Windows

echo.
echo ========================================
echo Coach Running Platform - Setup Script
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js installation...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check PostgreSQL
echo.
echo Checking PostgreSQL installation...
psql --version
if errorlevel 1 (
    echo WARNING: PostgreSQL might not be in PATH
    echo Please make sure PostgreSQL is installed and running
    echo You can verify by opening pgAdmin
    echo.
)

REM Create .env files if they don't exist
echo.
echo Setting up environment files...

if not exist "backend\.env" (
    echo Creating backend\.env
    copy backend\.env.example backend\.env
    echo Please edit backend\.env with your database credentials
) else (
    echo backend\.env already exists
)

if not exist "frontend\.env.local" (
    echo Creating frontend\.env.local
    copy frontend\.env.example frontend\.env.local
) else (
    echo frontend\.env.local already exists
)

REM Install backend dependencies
echo.
echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Backend npm install failed
    cd ..
    pause
    exit /b 1
)
cd ..

REM Install frontend dependencies
echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Frontend npm install failed
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Configure your database:
echo    - Edit backend\.env with your PostgreSQL credentials
echo    - Make sure the coaching_db database is created
echo.
echo 2. Start the backend:
echo    cd backend
echo    npm run dev
echo.
echo 3. Start the frontend (in another terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open http://localhost:5173 in your browser
echo.
echo For more information, read QUICKSTART.md
echo.
pause
