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

# Function to show spinning progress
show_spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    local message="$2"
    
    while [ "$(ps a | awk '{print $1}' | grep $pid)" ]; do
        local temp=${spinstr#?}
        printf "\r${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} %s %c" "$message" "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
    done
    printf "\r"
}

# Function to run command with spinner
run_with_spinner() {
    local cmd="$1"
    local message="$2"
    local success_msg="$3"
    local error_msg="$4"
    
    # Run command in background and capture output
    eval "$cmd" > /tmp/upgrade_output 2>&1 &
    local pid=$!
    
    # Show spinner
    show_spinner $pid "$message"
    
    # Wait for command to complete and get exit code
    wait $pid
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_success "$success_msg"
        return 0
    else
        print_error "$error_msg"
        echo "Command output:"
        cat /tmp/upgrade_output
        return $exit_code
    fi
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
if ! run_with_spinner "git pull" "Pulling latest changes from remote repository..." "Successfully pulled latest changes" "Failed to pull changes from git repository"; then
    exit 1
fi

# Check if package.json changed (might need npm install)
if git diff HEAD~1 HEAD --name-only | grep -q "package.json\|package-lock.json"; then
    if ! run_with_spinner "npm install" "Dependencies changed, updating..." "Dependencies updated successfully" "Failed to install dependencies"; then
        exit 1
    fi
fi

# Step 2: Build the application
if ! run_with_spinner "npm run build" "Building the application..." "Build completed successfully" "Build failed"; then
    exit 1
fi

# Step 3: Restart PM2
print_status "Checking PM2 status..."

# Get the PM2 app name (assuming it's the directory name or 'makerpass')
APP_NAME=${PWD##*/}  # Get current directory name
PM2_APP_NAME="makerpass"

# Check if the app is running in PM2
if pm2 list | grep -q "$PM2_APP_NAME"; then
    if ! run_with_spinner "pm2 restart $PM2_APP_NAME" "Restarting PM2 application: $PM2_APP_NAME..." "PM2 application restarted successfully" "Failed to restart PM2 application"; then
        exit 1
    fi
elif pm2 list | grep -q "$APP_NAME"; then
    if ! run_with_spinner "pm2 restart $APP_NAME" "Restarting PM2 application: $APP_NAME..." "PM2 application restarted successfully" "Failed to restart PM2 application"; then
        exit 1
    fi
else
    print_warning "No PM2 application found with name '$PM2_APP_NAME' or '$APP_NAME'"
    print_status "Available PM2 applications:"
    pm2 list
    echo ""
    read -p "Enter the PM2 application name to restart (or press Enter to skip): " USER_APP_NAME
    if [ -n "$USER_APP_NAME" ]; then
        if ! run_with_spinner "pm2 restart $USER_APP_NAME" "Restarting PM2 application: $USER_APP_NAME..." "PM2 application '$USER_APP_NAME' restarted successfully" "Failed to restart PM2 application '$USER_APP_NAME'"; then
            exit 1
        fi
    else
        print_warning "Skipped PM2 restart"
    fi
fi

# Show final status
print_status "Deployment complete! Checking PM2 status..."
pm2 status

# Cleanup temp file
rm -f /tmp/upgrade_output

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
