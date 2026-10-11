# ProTrader Android Auth Fix V2 — Read first

## Exactly what was wrong
1. APK login/register navigated to `https://localhost/verify-email.html` on unverified accounts. Phone screenshot showed WebView HTTP failure. V2 handles **resend and verification polling inside the current login/register screen**, no broken internal page navigation.
2. Forgot Password action now opens **inline Android recovery panel** (server-side emailed token, no insecure password shortcuts). Reset link in your email opens the **public ProTrader website in Chrome**; return to APK for result.
3. Google Sign-In was explicitly hidden in the earlier Android build; V2 restores a **native Google sign-in button** using Capacitor social login. You MUST configure Android OAuth signing fingerprints before it can work.
4. Existing email-only/password accounts and Google-only accounts are different. Backend explicitly rejects password on Google-only accounts unless password reset establishes password; never bypass Google account verification.

## What to upload to GitHub
This whole V2 folder replaces the source files in your **ProTrader-Android repo only**. Do not overwrite the original ProTrader website repo or backend. Existing MongoDB remains unchanged. GitHub upload via VS Code/Git strongly recommended to include `.github` and nested files. The repo root must contain `package.json`, `web`, `native-src`, `scripts`, `.github`, `capacitor.config.json`.

## GitHub Actions
`Build ProTrader Android APK` workflow has corrected Android SDK setup using `android-actions/setup-android@v4` (as used in AptiQuest fix). Run it and download `ProTrader-Android-Debug-APK` after green success.

## Google Sign-In prerequisites (crucial)
1. A Google **Web OAuth client ID** is already embedded in `web/google-config.js` and `native-src/native-google.js`. Its value must match your Render backend `GOOGLE_CLIENT_ID`; confirm in your own Google Cloud console.
2. Google Cloud Console > APIs & Services > Credentials: create an **Android OAuth client** in the SAME project as your Web client, package name `com.protrader.journal`, with signing certificate SHA-1.
3. Since GitHub Actions runner is ephemeral, DEBUG APK may be signed with a DIFFERENT key on every build. For reliable native Google login, generate a persistent debug signing keystore locally (keep it PRIVATE), add the **base64 of its bytes** in GitHub repo Actions secret named `ANDROID_DEBUG_KEYSTORE_BASE64` (not committed into public repository). Register the SHA-1 of that same signing certificate in Google Cloud. Workflow consumes that secret before Gradle build; it also logs SHA-1 in the signingReport step.
4. If Google OAuth consent screen is in Testing mode, add tester email under Google Cloud OAuth consent screen > Audience > Test users.
5. Rebuild and install the new APK. Use a phone with updated Google Play Services. Login button first calls native Google account picker, then posts signed Google ID token to existing `/api/auth/google` endpoint. Backend verifies ID token; never accept raw Google email/name as proof.
6. If native Google sign in fails, check logcat/errors and Android OAuth package/SHA-1 match. A working APK build alone does NOT prove Google login works.

How to generate debug signing keystore on Windows with JDK:
```
keytool -genkeypair -keystore protrade-debug.keystore -storepass android -alias androiddebugkey -keypass android -dname "CN=Android Debug,O=Android,C=US" -keyalg RSA -keysize 2048 -validity 10000
keytool -list -v -keystore protrade-debug.keystore -storepass android -alias androiddebugkey
```
Generate Base64 locally in PowerShell (do not paste private output in chat):
```
[Convert]::ToBase64String([IO.File]::ReadAllBytes((Resolve-Path .\protrade-debug.keystore))) | Set-Clipboard
```
Paste clipboard value directly into GitHub Actions secret, not a code file. Never upload your `.keystore` or secret into public GitHub.

## Backend settings
The existing Render backend still uses MongoDB. Keep `MONGODB_URI`, JWT_SECRET and other security env variables unchanged. CORS must allow the app origin `https://localhost` (previous mobile update did this). Password-reset and verification emails use `FRONTEND_URL`, which MUST be your live HTTPS website base, e.g. `https://eklavya0507.github.io/protrader` (verify the exact URL works, letter case matters). Never set `FRONTEND_URL=https://localhost`; localhost in email is not accessible in Chrome.

## Test checklist
- Login valid existing **email/password** account (no backend workaround for Google-only user).
- On EMAIL_NOT_VERIFIED, inline Verify email panel appears, resend works; email link opens website; app automatically detects verified account.
- Forgot password button: inline request -> email -> public website reset -> app detects completion -> sign in with new password.
- Google Sign-In: test only after Android OAuth app SHA-1 registration, stable signing, Render GOOGLE_CLIENT_ID match.
- Add trade on Android -> verify it appears on website -> delete test trade.

**Limitations:** This was code-reviewed and static syntax/asset checks can be done in this environment, but real GitHub Android build and phone OAuth/email testing still require the user to run them. Old installed APK does not update itself when GitHub source changes: rebuild and reinstall APK.
