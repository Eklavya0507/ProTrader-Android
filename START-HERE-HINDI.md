# ProTrader Online Android APK — START HERE

## Kya mila hai?
- `web/` mein tumhara original HTML/CSS/JS ProTrader frontend, photos/video aur existing trade screens.
- `web/mobile-app.js`, `web/mobile-app.css` — Android-only internet/Render API connectivity screen.
- `package.json`, `capacitor.config.json` — Capacitor 7 Android app configuration.
- `.github/workflows/build-protrader-android.yml` — GitHub Actions automatic testing APK build.
- `android-icons/` — ProTrader app icon.
- `www/` aur `android/` automatically generate hote hain; ZIP mein nahi.

## VERY IMPORTANT: LIVE BACKEND CORS UPDATE
Apne existing Render backend ke GitHub repo mein `ProTrader-Backend-Mobile-Update/server.js` wala UPDATED file deploy karo.
Backend currently website origin accept karta tha, Android Capacitor ka `https://localhost` origin nahi. Bina is change ke APK se login/data requests block ho sakti hain.
**MongoDB URI ya passwords change mat karna**; existing Render environment variables same rakho. CORS update se tumhara actual database data migrate nahi hota.

## GitHub group repo se APK build
1. ZIP extract karo. Andar `ProTrader-Android-App` open karo.
2. `ProTrader-Android-App` folder ke ANDAR ke ALL files group GitHub repository ke ROOT mein upload karo, including hidden `.github/workflows/build-protrader-android.yml`.
3. Group account par repository create karo, e.g. `ProTrader-Android`.
4. GitHub Repository → Actions → `Build ProTrader Android APK`.
5. `Run workflow` click karo (main branch).
6. Green check ke baad run → Artifacts → `ProTrader-Android-Debug-APK`.
7. ZIP extract → `app-debug.apk`. Apne Android phone par pehle TEST karo, phir friends ko share.

## VS Code (Windows PowerShell)
Project folder wahi open karo jahan package.json hai.
```powershell
npm install
npm run build
npx cap add android
npx cap sync android
```
`npx cap add android` SIRF pehli baar. Agar `android` folder pehle se hai to skip karo aur `npm run android:sync` use karo. APK build locally karne ke liye Android SDK + Java aur Gradle setup chahiye; GitHub Actions recommended hai.

## Website vs Android
Tumhari original website GitHub Pages par jaise thi waise hi reh sakti hai. Android app local packaged HTML se Render API (`https://protrader-backend-n8oj.onrender.com`) connect karega. Android app start hote hi login screen; server health inaccessible ho to reconnect screen. Real trade data online MongoDB backend se aayega.

## Current limitations
- Google One Tap on embedded Android WebViews unsupported: **email/password login use karo**. Google sign-in browser website par rahega. Native Google OAuth future implementation chahiye.
- Forgot/reset/verification emails website links open kar sakte hain, Android deep links implemented nahi hain.
- Android file exports/download and share dialogs require device testing, and may need native plugin support.
- Existing auth sessionStorage par hai; app restart par re-login required ho sakta hai.
- Network gate server `GET /api/health` check karta hai; Render sleep/network latency ho to 20–50 second wait lag sakta hai.
- Debug APK sirf testing ke liye. Public Play Store ke liye signed release AAB and privacy/data compliance separately chahiye.
- Online server live status aur phone par login is environment se independently verify nahi kiya ja saka. Device tests zaroor karo.

## Testing checklist
[ ] Android starts with login screen when internet is available.
[ ] Login with a REAL existing account succeeds.
[ ] Dashboard values match website and real MongoDB.
[ ] Add trade, edit trade, refresh and delete sync across devices.
[ ] Journal, Calendar, Risk Management, Reports, Settings load.
[ ] Internet OFF → reconnect screen appears; reconnect restores access.
[ ] Backend restart → app reconnects without losing data.
[ ] Password reset email flow works on external browser.
[ ] Google login is clearly marked as unavailable in Android beta.

Do not upload `.env` secrets to public GitHub. Keep database password/JWT secrets on Render only.
