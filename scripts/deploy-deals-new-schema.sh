#!/bin/bash

# Deploy deals_new schema to Supabase
# This script executes all SQL files in the correct order for the enhanced schema

set -e  # Exit on any error

echo "🚀 Deploying deals_new schema to Supabase..."

# Configuration
PROJECT_DIR="/Users/kelvin/Desktop/kelveloper/moomoo-climate-tracker"
SQL_DIR="$PROJECT_DIR/sql"

# Check if we're in the right directory
if [ ! -d "$SQL_DIR" ]; then
    echo "❌ Error: SQL directory not found at $SQL_DIR"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI not found"
    echo "Please install it with: npm install -g supabase"
    exit 1
fi

# Check if we're logged in to Supabase
if ! supabase status &> /dev/null; then
    echo "❌ Error: Not connected to Supabase project"
    echo "Please run: supabase login and supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo "📋 Deployment Plan:"
echo "  1. Create supporting tables (companies, investors, etc.)"
echo "  2. Create deals_new table with constraints"
echo "  3. Create indexes for performance"
echo "  4. Create Alex's scoring functions and triggers"
echo "  5. Insert sample data for testing"
echo ""

read -p "🤔 Do you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🔧 Starting deployment..."

# Step 1: Create supporting tables
echo "📦 Step 1/5: Creating supporting tables..."
if supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" --file "$SQL_DIR/create_supporting_tables.sql"; then
    echo "✅ Supporting tables created successfully"
else
    echo "❌ Failed to create supporting tables"
    exit 1
fi

# Step 2: Create deals_new table
echo "📦 Step 2/5: Creating deals_new table..."
if supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" --file "$SQL_DIR/create_deals_new_table.sql"; then
    echo "✅ deals_new table created successfully"
else
    echo "❌ Failed to create deals_new table"
    exit 1
fi

# Step 3: Create indexes
echo "📦 Step 3/5: Creating performance indexes..."
if supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" --file "$SQL_DIR/optimize_deals_new_indexes.sql"; then
    echo "✅ Performance indexes created successfully"
else
    echo "❌ Failed to create indexes"
    exit 1
fi

# Step 4: Create scoring functions
echo "📦 Step 4/5: Creating Alex's scoring functions..."
if supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" --file "$SQL_DIR/alex_scoring_functions.sql"; then
    echo "✅ Scoring functions created successfully"
else
    echo "❌ Failed to create scoring functions"
    exit 1
fi

# Step 5: Insert sample data
echo "📦 Step 5/5: Inserting sample data..."
if supabase db reset --db-url "$(supabase status | grep 'DB URL' | awk '{print $3}')" --file "$SQL_DIR/insert_sample_deals_new.sql"; then
    echo "✅ Sample data inserted successfully"
else
    echo "❌ Failed to insert sample data"
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 What's been deployed:"
echo "  ✅ Enhanced normalized schema with 8 tables"
echo "  ✅ deals_new table with UUID primary keys"
echo "  ✅ Performance indexes for real-time alerts"
echo "  ✅ Alex's investment scoring algorithm (0-100 scale)"
echo "  ✅ Automatic scoring triggers and functions"
echo "  ✅ Sample data including Jeh Aerospace deal"
echo ""
echo "🔍 Next steps:"
echo "  1. Update your API services to use deals_new table"
echo "  2. Configure real-time subscriptions in your app"
echo "  3. Set up Alex's custom alert rules"
echo "  4. Test the scoring algorithm with new deals"
echo ""
echo "🔗 Sample deals available for testing:"
echo "  • Jeh Aerospace ($11M Series A) - High AI score"
echo "  • ClimateAI Solutions ($5.5M Seed) - Very high score"
echo "  • GreenGrid Energy (CAD $11M Series A) - Good score"
echo "  • Industrial Carbon Solutions (£12M Series B) - Medium score"
echo "  • NextGen Battery Tech ($25M Series B) - Medium score"
echo ""
echo "📱 You can now test the real-time alert system!"
