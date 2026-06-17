#!/bin/sh

# AI Risk & Usage Reporter - Unified Startup Runner
# Designed for lightweight, resource-constrained environments like Alpine Linux.

# Exit immediately if any command in a pipeline fails
set -e

# Define directory paths
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$BASE_DIR/backend"
FRONTEND_DIR="$BASE_DIR/frontend"

echo "🛡️ AI Risk & Usage Reporter - Headless Runner"
echo "============================================="

# Function 1: Check and install dependencies
check_dependencies() {
  if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "📦 Backend dependencies missing. Installing silently..."
    npm --prefix "$BACKEND_DIR" install --silent --no-audit
  fi

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📦 Frontend dependencies missing. Installing silently..."
    npm --prefix "$FRONTEND_DIR" install --silent --no-audit
  fi
}

# Function 2: Launch in Production Mode (Highly Recommended for Alpine)
run_production() {
  check_dependencies

  echo "⚡ Production Mode: Optimized Single-Process Build"
  echo "--------------------------------------------------"
  echo "🏗️ Step 1: Compiling React TypeScript assets..."
  npm --prefix "$FRONTEND_DIR" run build

  echo "🚀 Step 2: Booting unified Express server on port 5001..."
  echo "👉 Navigate your browser to http://<your-vm-ip>:5001"
  echo "Press Ctrl+C to terminate."
  
  # Run the backend (which now also serves the frontend build statically!)
  npm --prefix "$BACKEND_DIR" start
}

# Function 3: Launch both hot-reloading dev servers (Development)
run_development() {
  check_dependencies

  echo "🛠️ Development Mode: Dual Hot-Reloading Servers"
  echo "------------------------------------------------"
  
  # Setup traps to cleanly kill background processes on exit (Ctrl+C)
  trap cleanup INT TERM

  cleanup() {
    echo "\n🛑 Shutting down development sub-processes..."
    if [ -n "$BACKEND_PID" ]; then kill "$BACKEND_PID" 2>/dev/null || true; fi
    if [ -n "$FRONTEND_PID" ]; then kill "$FRONTEND_PID" 2>/dev/null || true; fi
    echo "👋 Shutdown complete."
    exit 0
  }

  echo "🚀 Starting Node.js backend on http://localhost:5001/..."
  npm --prefix "$BACKEND_DIR" run dev &
  BACKEND_PID=$!

  echo "🚀 Starting Vite React server on http://localhost:5173/..."
  npm --prefix "$FRONTEND_DIR" run dev &
  FRONTEND_PID=$!

  echo "💡 Ready! Navigating to port 5173 will proxy API requests to 5001."
  echo "Press Ctrl+C to stop both servers."

  # Wait for both background processes
  wait $BACKEND_PID $FRONTEND_PID
}

# Parse Command Arguments
if [ "$1" = "--dev" ]; then
  run_development
else
  run_production
fi
