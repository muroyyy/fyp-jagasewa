#!/bin/bash

echo "Fixing template literal syntax correctly..."

# Fix template literals with proper regex
find frontend/src -name "*.jsx" -type f -exec sed -i "s/'\\${\([^}]*\)}\/\([^']*\)'/\`\\${\1}\/\2\`/g" {} \;

# Fix const declarations
find frontend/src -name "*.jsx" -type f -exec sed -i "s/const API_BASE_URL = '\\${\([^}]*\)}';/const API_BASE_URL = \`\\${\1}\`;/g" {} \;

echo "Template literals fixed correctly!"