# Diary Note Book – Android project (Capacitor)

Your React notes app, packaged as a real Android app (package `com.diarynotebook.app`, name **Diary Note Book**).
Everything is bundled inside the APK: it runs offline and stores all notes on the phone (IndexedDB inside the app's private storage).

## Easiest way to get the APK (no installs): GitHub Actions
1. Create a free GitHub account and a new **private** repository.
2. Upload everything in this folder (keep the `.github` folder).
3. Open the repository → **Actions** → **Build Android APK** → **Run workflow**.
4. After ~5–8 minutes open the finished run and download **DiaryNoteBook-debug-apk** → unzip → `app-debug.apk`.
5. Send it to your phone, open it, allow "Install unknown apps" for that app when Android asks, and install.

## Build on your own computer
Needs: Node 20+, JDK 17, Android Studio (or just the Android SDK with platform 34).
```
npm install
npm run android:debug          # builds android/app/build/outputs/apk/debug/app-debug.apk
```
Or open the `android/` folder in Android Studio and press Run / Build > Build APK(s).

## Signed release APK (for sharing / Play Store)
1. Create a key once (keep the file and passwords safe – you cannot update the app without them):
   `keytool -genkeypair -v -keystore release.keystore -alias diary -keyalg RSA -keysize 2048 -validity 10000`
2. Put `release.keystore` in `android/` and create `android/keystore.properties`:
   ```
   storeFile=../release.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=diary
   keyPassword=YOUR_KEY_PASSWORD
   ```
3. `npm run android:release` → `android/app/build/outputs/apk/release/app-release.apk`
   (On GitHub: add secrets KEYSTORE_BASE64 (`base64 -w0 release.keystore`), KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD and the workflow also builds the signed release.)

## What is in the project
- `src/App.jsx` – your notes app (unchanged apart from native fingerprint support).
- `src/main.jsx` – starts the app, connects native features (notifications, fingerprint, Back button, file export via the share sheet).
- `src/storage.js` – persistent on-device storage (replaces the browser-only `window.storage`).
- `android/` – the complete Android Studio project. Permissions are set in `android/app/src/main/AndroidManifest.xml`:
  internet (not used by the app itself), notifications, exact alarms and boot (reminders), biometric (locked notes), camera and microphone (photos, voice notes).
- Launcher icon: your light and dark logos are two launcher entries (`.NotebookLight` / `.NotebookDark`); the app switches between them when you change the theme (`AppIconPlugin.java`). Launchers can take a few seconds to refresh. A custom picture can't change the phone's launcher icon.
- Startup screen: light logo on white / dark logo on dark, following the phone's dark mode; inside the app the logo follows the app's own theme.

## Notes
- Exporting files opens Android's share sheet (Save to Drive / Files / email) because Android WebViews can't download directly.
- Reminders at an exact time may need "Alarms & reminders" permission on Android 12+/14 (Settings > Apps > Diary Note Book).
- Android's system backup may restore the app's data on a new phone (`allowBackup` is on). Set it to `false` in the manifest if you don't want that.
- Version: 1.0.0 (code 1). Change in `android/app/build.gradle` and `APP_CONFIG` in `src/App.jsx`.
