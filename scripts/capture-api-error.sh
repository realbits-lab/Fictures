#!/bin/bash

echo "🔍 Testing API endpoint and capturing error logs..."
echo ""

# Make API request
echo "📡 Making API request..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3000/api/community/stories/3JpLdcXb5hQK7zy5g3QIj)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
echo ""

# Wait a moment for logs to flush
sleep 1

# Capture recent error logs
echo "📋 Recent error logs:"
echo "===================="
tail -150 logs/dev-server.log | grep -A 15 "\[API\] Error\|getCommunityStory.*Error\|Error fetching story" | tail -50

echo ""
echo "✅ Log capture complete"
