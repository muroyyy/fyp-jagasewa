#!/bin/bash

# Update all API files to use centralized CORS configuration
echo "Updating CORS headers in all API files..."

# Find all PHP files with CORS headers and update them
find backend/api -name "*.php" -exec grep -l "Access-Control-Allow-Origin" {} \; | while read file; do
    echo "Updating: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Replace various CORS header patterns with centralized config
    sed -i '1,20{
        /header.*Access-Control-Allow-Origin/d
        /header.*Access-Control-Allow-Methods/d
        /header.*Access-Control-Allow-Headers/d
        /header.*Access-Control-Max-Age/d
        /header.*Access-Control-Allow-Credentials/d
        /header.*Content-Type.*application\/json/d
    }' "$file"
    
    # Add centralized CORS config after opening PHP tag
    sed -i '2i\
include_once '\''../../config/cors.php'\'';\
setCorsHeaders();\
' "$file"
    
done

echo "CORS headers updated in all API files!"