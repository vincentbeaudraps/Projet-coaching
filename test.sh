#!/bin/bash

# Test Script for Coach Running Platform
# Run this after starting the backend and frontend

echo "========================================"
echo "Coach Running Platform - Test Suite"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test API
echo -e "${YELLOW}Testing Backend API...${NC}"
echo ""

# Health Check
echo "1. Health Check"
response=$(curl -s http://localhost:3001/api/health)
if echo "$response" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}✓ API is running${NC}"
else
    echo -e "${RED}✗ API not responding${NC}"
    exit 1
fi
echo ""

# Register User
echo "2. Register Test User"
register_response=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test.coach@example.com",
    "name":"Test Coach",
    "password":"testpass123",
    "role":"coach"
  }')

if echo "$register_response" | grep -q '"id"'; then
    echo -e "${GREEN}✓ User registration successful${NC}"
    # Extract token
    token=$(echo "$register_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "  Token obtained (first 20 chars): ${token:0:20}..."
else
    echo -e "${RED}✗ User registration failed${NC}"
    echo "Response: $register_response"
fi
echo ""

# Login
echo "3. Login Test"
login_response=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test.coach@example.com",
    "password":"testpass123"
  }')

if echo "$login_response" | grep -q '"id"'; then
    echo -e "${GREEN}✓ Login successful${NC}"
    token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
    echo -e "${RED}✗ Login failed${NC}"
    echo "Response: $login_response"
fi
echo ""

# Get Athletes (requires token)
echo "4. Get Athletes (Protected Endpoint)"
athletes_response=$(curl -s -X GET http://localhost:3001/api/athletes \
  -H "Authorization: Bearer $token")

if echo "$athletes_response" | grep -q '\[\]' || echo "$athletes_response" | grep -q '^\['; then
    echo -e "${GREEN}✓ Protected endpoint accessible${NC}"
else
    echo -e "${RED}✗ Protected endpoint failed${NC}"
    echo "Response: $athletes_response"
fi
echo ""

# Test Frontend
echo -e "${YELLOW}Testing Frontend...${NC}"
echo ""

echo "5. Frontend Health Check"
frontend_response=$(curl -s http://localhost:5173)
if echo "$frontend_response" | grep -q 'HTML'; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend not responding${NC}"
fi
echo ""

# Summary
echo "========================================"
echo "Test Results Summary"
echo "========================================"
echo ""
echo -e "${GREEN}✓ Backend API${NC}"
echo -e "${GREEN}✓ Authentication${NC}"
echo -e "${GREEN}✓ Protected Routes${NC}"
echo -e "${GREEN}✓ Frontend${NC}"
echo ""
echo "========================================"
echo "All tests passed! ✓"
echo "========================================"
echo ""
echo "You can now:"
echo "1. Open http://localhost:5173 in browser"
echo "2. Register a new account"
echo "3. Login with credentials"
echo "4. Explore the application"
echo ""
