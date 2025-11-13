#!/bin/bash

# Keyboard Training Application Startup Script
# This script automatically checks and installs required dependencies, suitable for non-technical users

echo "=========================================="
echo "  Welcome to Keyboard Training Application"
echo "=========================================="
echo "Checking system environment..."

# Check operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "✓ macOS system detected"
    SYSTEM="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "✓ Linux system detected"
    SYSTEM="Linux"
else
    echo "⚠ Unknown operating system, compatibility issues may occur"
    SYSTEM="Unknown"
fi

# Check if we are in the correct directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "python_light_server" ]; then
    echo "❌ Error: Please run this script in the project root directory"
    echo "Current directory structure is incorrect, please make sure you are in the correct folder"
    exit 1
fi

# Check Homebrew (macOS)
if [ "$SYSTEM" = "macOS" ]; then
    if ! command -v brew &> /dev/null; then
        echo "⚠ Homebrew not detected, attempting to install..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        if [ $? -ne 0 ]; then
            echo "❌ Homebrew installation failed, please install manually and try again"
            echo "Visit https://brew.sh/ for installation guide"
            exit 1
        fi
        
        # Configure Homebrew in current session
        echo "Configuring Homebrew in current session..."
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo "✓ Homebrew configured successfully"
    else
        echo "✓ Homebrew already installed"
    fi
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "⚠ Node.js not detected, attempting to install..."
    if [ "$SYSTEM" = "macOS" ]; then
        brew install node
    else
        echo "❌ Cannot automatically install Node.js, please install manually and try again"
        echo "Visit https://nodejs.org/ to download and install Node.js"
        exit 1
    fi
else
    NODE_VERSION=$(node -v)
    echo "✓ Node.js installed ($NODE_VERSION)"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not detected, please ensure Node.js is properly installed"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo "✓ npm installed ($NPM_VERSION)"
fi

# Check Python3
if ! command -v python3 &> /dev/null; then
    echo "⚠ Python3 not detected, attempting to install..."
    if [ "$SYSTEM" = "macOS" ]; then
        brew install python3
    else
        echo "❌ Cannot automatically install Python3, please install manually and try again"
        echo "Visit https://www.python.org/downloads/ to download and install Python3"
        exit 1
    fi
else
    PYTHON_VERSION=$(python3 --version)
    echo "✓ Python3 installed ($PYTHON_VERSION)"
fi

echo ""
echo "Installing project dependencies..."

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Frontend dependencies installation failed"
        exit 1
    fi
    echo "✓ Frontend dependencies installed successfully"
else
    echo "✓ Frontend dependencies already exist"
fi
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd python_light_server
if ! python3 -c "import flask" &> /dev/null; then
    pip3 install flask
    if [ $? -ne 0 ]; then
        echo "❌ Flask installation failed"
        exit 1
    fi
    echo "✓ Flask installed successfully"
else
    echo "✓ Flask already installed"
fi
cd ..

# Install root directory dependencies
echo "Installing root directory dependencies..."
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Root directory dependencies installation failed"
        exit 1
    fi
    echo "✓ Root directory dependencies installed successfully"
else
    echo "✓ Root directory dependencies already exist"
fi

echo ""
echo "=========================================="
echo "  Starting Application"
echo "=========================================="

# Start backend Flask server (in background)
echo "Starting backend server (port 5050)..."
cd python_light_server
python3 light_server.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend server to start
sleep 3

# Check if backend server started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo "✓ Backend server started"
else
    echo "⚠ Backend server may need more time to start, please wait..."
fi

echo "Starting frontend development server (port 3000)..."
echo "Once started, the application will automatically open in your browser"
echo "If the browser doesn't open automatically, please visit http://localhost:3000 manually"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop the application"
echo ""

# Start frontend React application
npm start

# Stop backend server when frontend server exits
echo ""
echo "Stopping backend server..."
kill $BACKEND_PID 2>/dev/null

echo ""
echo "Application closed, thank you for using!"