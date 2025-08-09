#!/bin/bash

# upgrade.sh - Automated deployment script for MakerPass Dashboard
# This script pulls the latest changes, builds the app, and restarts PM2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "git is not installed or not in PATH"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed or not in PATH"
    exit 1
fi

# Check if pm2 is available
if ! command -v pm2 &> /dev/null; then
    print_error "pm2 is not installed or not in PATH"
    exit 1
fi

echo "========================================"
echo "  MakerPass Dashboard Upgrade Script"
echo "========================================"
echo ""

# Show current branch and status
print_status "Checking git status..."
CURRENT_BRANCH=$(git branch --show-current)
print_status "Current branch: ${CURRENT_BRANCH}"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes in your working directory."
    echo "These changes might conflict with the update."
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Upgrade cancelled."
        exit 0
    fi
fi

# Step 1: Git pull
print_status "Pulling latest changes from remote repository..."
if git pull; then
    print_success "Successfully pulled latest changes"
else
    print_error "Failed to pull changes from git repository"
    exit 1
fi

# Check if package.json changed (might need npm install)
if git diff HEAD~1 HEAD --name-only | grep -q "package.json\|package-lock.json"; then
    print_status "package.json or package-lock.json changed, running npm install..."
    if npm install; then
        print_success "Dependencies updated successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
fi

# Step 2: Build the application
print_status "Building the application..."
if npm run build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Step 3: Restart PM2
print_status "Checking PM2 status..."

# Get the PM2 app name (assuming it's the directory name or 'makerpass-dashboard')
APP_NAME=${PWD##*/}  # Get current directory name
PM2_APP_NAME="makerpass-dashboard"

# Check if the app is running in PM2
if pm2 list | grep -q "$PM2_APP_NAME"; then
    print_status "Restarting PM2 application: $PM2_APP_NAME"
    if pm2 restart "$PM2_APP_NAME"; then
        print_success "PM2 application restarted successfully"
    else
        print_error "Failed to restart PM2 application"
        exit 1
    fi
elif pm2 list | grep -q "$APP_NAME"; then
    print_status "Restarting PM2 application: $APP_NAME"
    if pm2 restart "$APP_NAME"; then
        print_success "PM2 application restarted successfully"
    else
        print_error "Failed to restart PM2 application"
        exit 1
    fi
else
    print_warning "No PM2 application found with name '$PM2_APP_NAME' or '$APP_NAME'"
    print_status "Available PM2 applications:"
    pm2 list
    echo ""
    read -p "Enter the PM2 application name to restart (or press Enter to skip): " USER_APP_NAME
    if [ -n "$USER_APP_NAME" ]; then
        if pm2 restart "$USER_APP_NAME"; then
            print_success "PM2 application '$USER_APP_NAME' restarted successfully"
        else
            print_error "Failed to restart PM2 application '$USER_APP_NAME'"
            exit 1
        fi
    else
        print_warning "Skipped PM2 restart"
    fi
fi

# Show final status
print_status "Showing PM2 status..."
pm2 status

echo ""
echo "========================================"
print_success "Upgrade completed successfully!"
echo "========================================"
print_status "Summary:"
print_status "  ✓ Git pull completed"
print_status "  ✓ Application built"
print_status "  ✓ PM2 application restarted"
echo ""
print_status "Your application should now be running with the latest changes."
