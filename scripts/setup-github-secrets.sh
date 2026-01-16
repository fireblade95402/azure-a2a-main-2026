#!/bin/bash

# Script to add GitHub secrets from .env file
# Usage: ./scripts/setup-github-secrets.sh

REPO="slacassegbb/azure-a2a-main"
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

echo "Adding GitHub secrets from $ENV_FILE to $REPO..."
echo ""

# Read each line from .env and add as secret
while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" == \#* ]]; then
        continue
    fi
    
    # Remove any quotes from value
    value="${value%\"}"
    value="${value#\"}"
    
    echo "Adding secret: $key"
    
    # Use GitHub CLI to set secret
    echo "$value" | gh secret set "$key" --repo "$REPO"
    
    if [ $? -eq 0 ]; then
        echo "✅ $key added successfully"
    else
        echo "❌ Failed to add $key"
    fi
    echo ""
done < "$ENV_FILE"

echo "Done! All secrets have been added to GitHub repository."
echo "Visit https://github.com/$REPO/settings/secrets/actions to verify."
