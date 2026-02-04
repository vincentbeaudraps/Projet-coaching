#!/bin/bash

# Installation script for Coach Running Platform on macOS/Linux

echo ""
echo "========================================"
echo "Coach Running Platform - Setup Script"
echo "========================================"
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
node --version

# Check PostgreSQL
echo ""
echo "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo "WARNING: PostgreSQL might not be in PATH"
    echo "Please make sure PostgreSQL is installed and running"
    echo ""
fi

# Create .env files if they don't exist
echo ""
echo "Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env"
    cp backend/.env.example backend/.env
    echo "Please edit backend/.env with your database credentials"
else
    echo "backend/.env already exists"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend/.env.local"
    cp frontend/.env.example frontend/.env.local
else
    echo "frontend/.env.local already exists"
fi

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Backend npm install failed"
    cd ..
    exit 1
fi
cd ..

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Frontend npm install failed"
    cd ..
    exit 1
fi
cd ..

echo ""
echo "========================================"
echo "Setup completed successfully!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Configure your database:"
echo "   - Edit backend/.env with your PostgreSQL credentials"
echo "   - Make sure the coaching_db database is created"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo "For more information, read QUICKSTART.md"
echo ""
