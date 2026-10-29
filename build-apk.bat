@echo off
call npm install
call npm run build
call npx cap sync android
cd android
call gradlew.bat assembleDebug
echo APK: android\app\build\outputs\apk\debug\app-debug.apk
