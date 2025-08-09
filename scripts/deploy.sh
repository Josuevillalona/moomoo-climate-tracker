#!/bin/bash

# Climate Tech Funding Dashboard Deployment Script
# This script handles deployment preparation and validation

set -e

echo "🚀 Starting deployment preparation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_environment() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "NODE_ENV"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_status "All required environment variables are set ✓"
}

# Validate Supabase connection
validate_supabase() {
    print_status "Validating Supabase connection..."
    
    # Test connection using curl
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/deals?select=count&limit=1")
    
    if [ "$response" -eq 200 ]; then
        print_status "Supabase connection validated ✓"
    else
        print_error "Supabase connection failed (HTTP $response)"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running test suite..."
    
    if npm run test:ci; then
        print_status "All tests passed ✓"
    else
        print_error "Tests failed"
        exit 1
    fi
}

# Build application
build_app() {
    print_status "Building application..."
    
    if npm run build; then
        print_status "Build completed successfully ✓"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Check build size
check_build_size() {
    print_status "Checking build size..."
    
    if [ -d ".next" ]; then
        build_size=$(du -sh .next | cut -f1)
        print_status "Build size: $build_size"
        
        # Warn if build is larger than 50MB
        size_bytes=$(du -s .next | cut -f1)
        if [ "$size_bytes" -gt 51200 ]; then  # 50MB in KB
            print_warning "Build size is larger than 50MB. Consider optimizing."
        fi
    else
        print_error "Build directory not found"
        exit 1
    fi
}

# Generate deployment report
generate_report() {
    print_status "Generating deployment report..."
    
    cat > deployment-report.md << EOF
# Deployment Report

**Date:** $(date)
**Environment:** $NODE_ENV
**Build Size:** $(du -sh .next | cut -f1)
**Node Version:** $(node --version)
**NPM Version:** $(npm --version)

## Environment Configuration
- Supabase URL: $NEXT_PUBLIC_SUPABASE_URL
- Node Environment: $NODE_ENV

## Pre-deployment Checks
- ✅ Environment variables validated
- ✅ Supabase connection tested
- ✅ Test suite passed
- ✅ Build completed successfully
- ✅ Build size checked

## Next Steps
1. Deploy to staging environment
2. Run smoke tests
3. Deploy to production
4. Monitor application health

EOF
    
    print_status "Deployment report generated: deployment-report.md"
}

# Main deployment preparation flow
main() {
    print_status "Climate Tech Funding Dashboard - Deployment Preparation"
    echo "=================================================="
    
    check_environment
    validate_supabase
    run_tests
    build_app
    check_build_size
    generate_report
    
    print_status "🎉 Deployment preparation completed successfully!"
    print_status "Review deployment-report.md for details"
}

# Run main function
main "$@"