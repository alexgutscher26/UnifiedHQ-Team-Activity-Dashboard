#!/bin/bash

# Test Daily Summary Cron Job
echo "Testing Daily Summary Cron Job..."

# Test health check
echo "1. Testing health check..."
curl -s http://localhost:3000/api/ai-summary/cron | jq '.'

# Test cron endpoint (replace with your actual token)
echo "2. Testing cron endpoint..."
curl -X POST http://localhost:3000/api/ai-summary/cron \
  -H "Authorization: Bearer fKtpJNGYBiQH8Fl90O7kRS9cUedrzRMkPOv/vLgV3C0=" \
  -H "Content-Type: application/json" | jq '.'

echo "Test completed!"
