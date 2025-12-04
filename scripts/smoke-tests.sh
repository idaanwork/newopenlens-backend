#!/bin/bash

API_URL=${API_URL:-http://localhost:3000}
API_V1="$API_URL/api/v1"

echo "🧪 Running OpenLens Smoke Tests..."
echo "API URL: $API_URL"
echo ""

# Test health endpoint
echo "1️⃣  Testing /health endpoint..."
curl -s "$API_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Register test user
echo "2️⃣  Testing user registration..."
REGISTER=$(curl -s -X POST "$API_V1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }')
TOKEN=$(echo $REGISTER | jq -r '.token')
echo "Token: ${TOKEN:0:20}..."
echo ""

# Login test user
echo "3️⃣  Testing user login..."
curl -s -X POST "$API_V1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq '.token' || echo "❌ Login failed"
echo ""

# Get user profile
echo "4️⃣  Testing GET /auth/me..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_V1/auth/me" | jq '.' || echo "❌ Get user failed"
echo ""

# List libraries
echo "5️⃣  Testing GET /libraries..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_V1/libraries" | jq '.data | length' || echo "❌ List libraries failed"
echo ""

# Get admin stats
echo "6️⃣  Testing GET /admin/stats..."
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API_V1/admin/stats" | jq '.' || echo "❌ Get stats failed"
echo ""

echo "✅ Smoke tests completed!"
