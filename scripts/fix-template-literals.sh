#!/bin/bash

echo "Fixing template literal syntax in all frontend files..."

# Fix single quotes to backticks for template literals
find frontend/src -name "*.jsx" -exec sed -i "s/'\${import.meta.env.VITE_API_URL}/\`\${import.meta.env.VITE_API_URL}/g" {} \;

# Fix closing quotes
find frontend/src -name "*.jsx" -exec sed -i "s/\${import.meta.env.VITE_API_URL}'/\${import.meta.env.VITE_API_URL}\`/g" {} \;

echo "Template literal syntax fixed in all files!"