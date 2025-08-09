#!/bin/bash

# Environment Setup Script for Climate Tech Funding Dashboard
# This script helps set up environment variables for different deployment environments

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create environment file
create_env_file() {
    local env_type=$1
    local filename=".env.${env_type}"
    
    print_status "Creating $filename..."
    
    case $env_type in
        "local")
            cat > $filename << 'EOF'
# Local Development Environment
NODE_ENV=development

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_local_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_supabase_anon_key_here

# Optional: Analytics and Monitoring
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_LOG_LEVEL=debug

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_CACHING=true
EOF
            ;;
        "staging")
            cat > $filename << 'EOF'
# Staging Environment
NODE_ENV=production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_staging_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_supabase_anon_key_here

# Analytics and Monitoring
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_LOG_LEVEL=info

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_CACHING=true

# Performance Settings
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_RETRY_ATTEMPTS=3
EOF
            ;;
        "production")
            cat > $filename << 'EOF'
# Production Environment
NODE_ENV=production

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key_here

# Analytics and Monitoring
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_LOG_LEVEL=error

# Feature Flags
NEXT_PUBLIC_ENABLE_REAL_TIME=true
NEXT_PUBLIC_ENABLE_CACHING=true

# Performance Settings
NEXT_PUBLIC_API_TIMEOUT=5000
NEXT_PUBLIC_RETRY_ATTEMPTS=2

# Security Settings
NEXT_PUBLIC_ENABLE_CSP=true
EOF
            ;;
    esac
    
    print_status "$filename created successfully"
    print_warning "Please update the placeholder values with your actual configuration"
}

# Function to validate environment file
validate_env_file() {
    local filename=$1
    
    if [ ! -f "$filename" ]; then
        print_error "$filename not found"
        return 1
    fi
    
    print_status "Validating $filename..."
    
    # Check for placeholder values
    if grep -q "your_.*_here" "$filename"; then
        print_warning "$filename contains placeholder values that need to be updated"
        grep "your_.*_here" "$filename"
        return 1
    fi
    
    # Check required variables
    required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NODE_ENV")
    
    for var in "${required_vars[@]}"; do
        if ! grep -q "^$var=" "$filename"; then
            print_error "Missing required variable: $var in $filename"
            return 1
        fi
    done
    
    print_status "$filename validation passed ✓"
    return 0
}

# Main function
main() {
    echo "🔧 Environment Setup for Climate Tech Funding Dashboard"
    echo "======================================================"
    
    if [ $# -eq 0 ]; then
        echo "Usage: $0 [local|staging|production|validate]"
        echo ""
        echo "Commands:"
        echo "  local      - Create .env.local for development"
        echo "  staging    - Create .env.staging for staging environment"
        echo "  production - Create .env.production for production environment"
        echo "  validate   - Validate existing environment files"
        exit 1
    fi
    
    case $1 in
        "local"|"staging"|"production")
            create_env_file $1
            ;;
        "validate")
            for env_file in .env.local .env.staging .env.production; do
                if [ -f "$env_file" ]; then
                    validate_env_file "$env_file"
                fi
            done
            ;;
        *)
            print_error "Unknown command: $1"
            exit 1
            ;;
    esac
}

main "$@"