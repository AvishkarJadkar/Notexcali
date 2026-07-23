#!/bin/bash
# Render Build Script — Injects Firebase secrets into firebase.js
# Set these as Environment Variables in your Render dashboard.

set -e

echo "🔥 Injecting Firebase configuration..."

sed -i "s|FIREBASE_API_KEY_PLACEHOLDER|$FIREBASE_API_KEY|g" utils/firebase.js
sed -i "s|FIREBASE_AUTH_DOMAIN_PLACEHOLDER|$FIREBASE_AUTH_DOMAIN|g" utils/firebase.js
sed -i "s|FIREBASE_PROJECT_ID_PLACEHOLDER|$FIREBASE_PROJECT_ID|g" utils/firebase.js
sed -i "s|FIREBASE_STORAGE_BUCKET_PLACEHOLDER|$FIREBASE_STORAGE_BUCKET|g" utils/firebase.js
sed -i "s|FIREBASE_MESSAGING_SENDER_ID_PLACEHOLDER|$FIREBASE_MESSAGING_SENDER_ID|g" utils/firebase.js
sed -i "s|FIREBASE_APP_ID_PLACEHOLDER|$FIREBASE_APP_ID|g" utils/firebase.js
sed -i "s|FIREBASE_MEASUREMENT_ID_PLACEHOLDER|$FIREBASE_MEASUREMENT_ID|g" utils/firebase.js

echo "✅ Firebase config injected successfully."
