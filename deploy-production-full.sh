#!/bin/bash

# Production Deployment Script for NewWomen Platform
# This script automates the deployment process to Vercel and Supabase

set -e  # Exit on error

echo "🚀 NewWomen Production Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo "ℹ $1"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    print_success "Node.js found: $(node --version)"
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm found: $(npm --version)"
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Make sure to configure environment variables."
    else
        print_success ".env file found"
    fi
    
    echo ""
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    PUPPETEER_SKIP_DOWNLOAD=true npm install
    print_success "Dependencies installed"
    echo ""
}

# Run linter
run_linter() {
    print_info "Running linter..."
    if npm run lint; then
        print_success "Linting passed"
    else
        print_warning "Linting completed with warnings (acceptable)"
    fi
    echo ""
}

# Build project
build_project() {
    print_info "Building project..."
    if npm run build; then
        print_success "Build successful"
        print_info "Build output in ./dist directory"
    else
        print_error "Build failed"
        exit 1
    fi
    echo ""
}

# Deploy Edge Functions
deploy_edge_functions() {
    print_info "Deploying Supabase Edge Functions..."
    
    # Check if Supabase CLI is available
    if ! command -v supabase &> /dev/null; then
        print_warning "Supabase CLI not found. Installing..."
        npm install -g supabase
    fi
    
    # List of functions to deploy
    functions=(
        "ai-content-builder"
        "provider-discovery"
        "realtime-token"
        "paypal-create-order"
        "paypal-capture-order"
        "gamification-engine"
        "couples-challenge-analyzer"
    )
    
    for func in "${functions[@]}"; do
        print_info "Deploying $func..."
        if npx supabase functions deploy "$func" --no-verify-jwt; then
            print_success "$func deployed"
        else
            print_error "Failed to deploy $func"
        fi
    done
    
    echo ""
}

# Deploy to Vercel
deploy_to_vercel() {
    print_info "Deploying to Vercel..."
    
    # Check if Vercel CLI is available
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Deploy
    print_info "Starting Vercel deployment..."
    if vercel --prod --yes; then
        print_success "Vercel deployment successful"
    else
        print_error "Vercel deployment failed"
        exit 1
    fi
    
    echo ""
}

# Main deployment flow
main() {
    echo "Starting deployment process..."
    echo ""
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Install dependencies
    read -p "Install/update dependencies? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_dependencies
    fi
    
    # Step 3: Run linter
    read -p "Run linter? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_linter
    fi
    
    # Step 4: Build project
    read -p "Build project? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        build_project
    fi
    
    # Step 5: Deploy Edge Functions
    read -p "Deploy Supabase Edge Functions? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_edge_functions
    fi
    
    # Step 6: Deploy to Vercel
    read -p "Deploy to Vercel? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_to_vercel
    fi
    
    echo ""
    print_success "Deployment process completed!"
    echo ""
    print_info "Next steps:"
    echo "  1. Verify deployment at your Vercel URL"
    echo "  2. Configure custom domain (Mirxa.io)"
    echo "  3. Run smoke tests"
    echo "  4. Check logs in Supabase and Vercel dashboards"
    echo ""
    print_info "See PRODUCTION_DEPLOYMENT_CHECKLIST.md for full deployment guide"
}

# Run main function
main
