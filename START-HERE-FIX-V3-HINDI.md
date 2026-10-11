# ProTrader Android V3 — Login, Google aur website-style UI fix

## APK me ab kya change hai?
- Android app ka opening page **original ProTrader website ka index.html** hoga (pehle build script login.html par force redirect karta tha).
- Google native login se optional `scopes` remove kiye; plugin ke default profile/email identity scopes use honge. Isse screenshot wala `You CANNOT use scopes without modifying the main activity` error avoid hona chahiye.
- Registration ke baad agar backend `VERIFICATION_EMAIL_FAILED` deta hai, app batayegi ki account bana hai par **email service fail** hui. Same email ko dobara register mat karo. Resend manually dabao.
- Existing backend URL, login rules, trades, MongoDB, account data, dashboard etc. unchanged.
- Ye Android source ZIP hai, actual APK nahi. GitHub Actions se build karna hoga.

## GitHub Browser se update karo (VS Code optional)
1. ProTrader-Android GitHub repo open karo: https://github.com/Eklavya0507/ProTrader-Android
2. Browser me 100+ files ek saath upload nahi karni. **Only changed files** ko replace karo (neeche list).
3. Direct GitHub editor se edit ya `V3-PATCH-ONLY.zip` se exact files upload kar sakte ho.
4. Main branch par commit karne ke baad Actions > Build ProTrader Android APK > latest run open karo.
5. Green check > Artifacts > ProTrader-Android-Debug-APK download karo.
6. Purane APK par update tabhi hoga jab signing key same ho aur versionCode suitably increment ho. Debug APK me uninstall/reinstall ki zarurat pad sakti hai—pehle unsynced local data ka backup verify kar lo.

### Changed files only
- `scripts/build-web.js`
- `native-src/native-google.js`
- `web/mobile-auth-recovery.js`
- `web/register.html`
- `web/google-auth.js`
- `web/login.html`
- `package.json`
- `.github/workflows/build-protrader-android.yml`

## IMPORTANT: Signup / password reset emails APK se fix nahin ho sakte
Original Node backend emails **Brevo transactional API** se send karta hai: `utils/sendEmail.js`.
Screenshot `Verification email could not be sent` ka matlab backend failed send; APK ne message sahi dikhaya.

Render Dashboard > ProTrader backend > Environment mein values check karo (secrets share mat karna):
- `BREVO_API_KEY` (active transactional API key)
- `BREVO_SENDER_EMAIL` (Brevo me verified/approved sender)
- `BREVO_SENDER_NAME`
- `FRONTEND_URL` = working public HTTPS ProTrader website URL (e.g. https://eklavya0507.github.io/protrader); **https://localhost nahi**

Render > Logs me signup/resend ya forgot password ke time check karo:
- `Verification email failed:`
- `Verification email resend failed:`
- `Password reset email failed:`

Common causes: invalid/expired API key, Brevo sender not verified, quota/rate limits, API access restrictions. Do not bypass email verification or manually modify MongoDB `isEmailVerified` flags. Email delivery must be repaired on server.

## Google Login ka remaining setup
- App ID / Android package: `com.protrader.journal`
- Google Cloud me Web Client ID should match native-src/native-google.js **and** Render `GOOGLE_CLIENT_ID`.
- Google Cloud me Android OAuth client same package name and **actual APK signing certificate SHA-1** ke saath create karo.
- GitHub Actions runner per-build random debug signing ho sakti hai. Stable keystore ke liye `ANDROID_DEBUG_KEYSTORE_BASE64` Actions secret use karo (existing workflow supports this); never post it in chat / commit it.
- Google Cloud OAuth test mode: add test users.
- Fix ke baad real Android phone par Google sign-in end-to-end test abhi bhi necessary hai.

## Testing
1. Install new APK, app **original website landing page** par open hogi.
2. Sign In > existing verified email/password account test karo. Google-only accounts regular password se sign in nahi kar sakte jab tak reset completed na ho.
3. Google Sign In: scopes wala error nahin aana chahiye; Android OAuth error aaye to package/SHA-1 check.
4. Sign up: new email se test karo; app verification link email mein send kar payegi sirf Brevo fix ke baad.
5. Forgot Password: email bhejne ke liye same Brevo backend required.
6. Android me test trade add karo aur same account se original website par verify karo.
