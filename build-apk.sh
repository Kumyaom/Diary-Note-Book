#!/usr/bin/env sh
set -e
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
