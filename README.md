# DhwaniPay — Your phone. Your payment soundbox.

A mobile-first Expo + React Native + TypeScript prototype for demonstrating how a compatible Android phone could announce supported incoming payment notifications for small merchants.

## What is included

- Compulsory merchant authentication: Email sign in and account registration guard access to the app.
- A four-destination bottom navigation: Home, Expenses, Activity and Settings.
- Onboarding and seven-language selection using native script labels.
- Guided setup checklist and notification-source selection.
- Notification-access education, health diagnostics and friendly recovery screens.
- Voice-test screen using the device's text-to-speech engine through `expo-speech`.
- Event detail and filtered activity timeline.
- Daily shop expense manager with Add, Remove, and Settled/Pending status tracking.
- Language/accessibility/theme settings, privacy explanation and FAQs.
- A demo lab that simulates ₹10/₹40 notifications, announcement failure and missing permission.
- Shared UI components and centralized light/dark color tokens.

## Run locally

Prerequisites: Node.js 22.13+ and npm (the project uses Expo SDK 57). Use a current Expo Go client or run on an Android emulator/device with Expo's normal development workflow.

```bash
npm install
npx expo start
```

Then use the QR code with an SDK-compatible Expo Go client, or press `a` in the Expo terminal to open an Android emulator. If package versions need reconciliation, run `npx expo install --fix` after `npm install`.

Useful scripts:

```bash
npm run typecheck
npm run android
npm run web
```

## Demo walkthrough (about 90 seconds)

1. Start on Home; point out the visible `DEMO MODE — sample events only` label.
2. Tap **Test voice** and play the ₹40 sample announcement.
3. Return to Home and open **Demo lab**.
4. Simulate a ₹10 or ₹40 notification and return to Activity to show its distinct detection/announcement state.
5. Simulate announcement failure and open its event details/recovery guidance.
6. Simulate missing permission and show the setup-needed state and notification-access guide.
7. Open Settings to configure languages, soundbox diagnostics, and merchant UPI profiles.
8. Reset the demo before handing the app to a judge.

## What's real vs. architecture components

**Fully wired and functional:**
- **Dynamic NPCI UPI QR Generation**: ISO/IEC 18004 QR generation with Reed-Solomon error correction and NPCI deep linking.
- **Android Native Soundbox Listener**: Custom Kotlin `PaymentNotificationListenerService` and `PaymentListenerModule` Expo native module bridge (`modules/payment-listener`) that intercepts live merchant notifications and emits them into React Native.
- **Permission Management**: Live detection of `enabled_notification_listeners` and direct launcher for Android Notification Access settings.
- **TTS Soundbox Announcements**: Regional language speech synthesis (Hindi, Telugu, Tamil, Kannada, Marathi, English) via `expo-speech`.
- **Persistent Storage**: Multi-platform persistence via `@react-native-async-storage/async-storage`.
- **Cloud Database & Ledger Sync**: Supabase PostgreSQL synchronization with RLS policies and offline-safe record merging.
- **WebSocket Gateway Microservice**: Live webhook bridge with HMAC-SHA256 signature verification and auto-reconnecting WebSocket client.

**In development/preview:**
- Enterprise payment aggregator direct settlements (Razorpay POS / Cashfree production webhooks require merchant bank verification keys).

## Architecture

```text
Android OS Notification System / Banking Apps (PhonePe, GPay, Paytm)
        │
PaymentNotificationListenerService.kt (WakeLock, Regex Extraction, Dedup)
        │ Broadcast Intent ("in.dhwanipay.app.PAYMENT_RECEIVED")
PaymentListenerModule.kt (Expo Native Module Bridge)
        │ EventEmitter ("onPaymentReceived")
React Native AppContext ────► Audio Soundbox (expo-speech TTS)
        │
        ├── AsyncStorage (Persistent local ledger)
        ├── Supabase Cloud PostgreSQL (RLS-secured sync)
        └── WebSocket Client (Live Gateway Webhook fallback)
```

## Production UPI Architecture & Real Payments

DhwaniPay supports **two production models** for handling real, live UPI payments:

### 1. In-App Dynamic UPI QR & Intent Payment (NPCI Standard)
- **Standard UPI Deep Linking**: Generates real `upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR` QR codes using a zero-dependency vector SVG generator.
- **Standee & Custom Bills**: The merchant enters their verified UPI VPA (e.g. `sharma@okhdfcbank` or `mobile@paytm`) and shop name.
- **Universal Scan & Pay**: Any customer scanning with Google Pay, PhonePe, Paytm, BHIM, or CRED pays directly into the merchant's real bank account.
- **Native UPI Intent**: Tapping "Open in UPI App" invokes Android's native UPI intent resolver.

### 2. Android Native Soundbox (`NotificationListenerService`)
- **Native Kotlin Service**: `android-native/PaymentNotificationListenerService.kt` intercepts notifications from Google Pay for Business, PhonePe Merchant, Paytm, BHIM, and bank SMS.
- **Regex Extraction**: Parses amount, payer name, and UTR transaction ID.
- **Deduplication Engine**: Sliding-window hash table prevents duplicate announcements on notification sync.
- **Foreground Service & WakeLock**: Holds `PARTIAL_WAKE_LOCK` to announce incoming payments aloud even when the phone screen is locked or sleeping.
- **Expo Config Plugin**: `plugins/withNotificationListener.js` automatically configures permissions and registers the service in `AndroidManifest.xml` during `npx expo prebuild` or EAS Build.

### 3. Cloud Webhook & WebSocket Microservice (`server/`)
- For enterprise and zero-spoofing bank settlements (e.g. Razorpay POS/QR, Cashfree AutoCollect, Setu UPI).
- Microservice verifies HMAC-SHA256 signatures (`x-razorpay-signature`, `x-webhook-signature`).
- Instantly broadcasts verified settlement packets to connected DhwaniPay apps via real-time WebSocket (`ws://`).

## Running the Cloud Webhook Server
```bash
cd server
npm install
npm run dev
```

## Building Native Android APK

### Option 1: EAS Cloud Build (Recommended — No Android Studio or SDK required)

EAS Build compiles your application in an isolated cloud container with the exact Android SDK, NDK, and JDK 17 toolchain, producing a direct `.apk` download link & QR code you can install immediately on any Android device.

1. **Log in to Expo / EAS** (Create a free account at [expo.dev](https://expo.dev) if you don't have one):
   ```bash
   eas login
   ```

2. **Trigger the standalone APK build**:
   ```bash
   npm run build:apk
   # or directly:
   eas build --platform android --profile preview
   ```

3. **Install on device**:
   When the build finishes (usually 3-5 minutes), EAS will display a link and a terminal QR code. Open the link or scan the QR code with your Android phone to download and install `DhwaniPay.apk`.

---

### Option 2: Local Gradle Build (Requires Android Studio & JDK 17)

If you prefer compiling locally on your machine:

1. **Prerequisites**:
   - Install **JDK 17** (ensure `JAVA_HOME` points to JDK 17).
   - Install **Android Studio** with Android SDK Platform 35 and Build-Tools `35.0.0`.
   - Set `ANDROID_HOME` in your environment (e.g., `%LOCALAPPDATA%\Android\Sdk`).

2. **Generate the native project**:
   ```bash
   npm run prebuild
   ```

3. **Compile Release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
   The compiled APK will be located at:
   `android/app/build/outputs/apk/release/app-release.apk`


## Supabase Cloud Database & Email Authentication

DhwaniPay includes production-ready **Supabase Email Authentication and PostgreSQL Database Synchronization**:

### Database Tables (`supabase/schema.sql`)
1. **`merchants`**: Linked to `auth.users(id)` via foreign key. Stores shop name, primary VPA, phone, language, and soundbox settings.
2. **`payment_events`**: Stores every payment intercepted by the Android Notification Listener (amount, source app, payer name, UTR, raw notification text, announcement state).
3. **`expenses`**: Merchant daily expense and supplier ledger (title, amount, category, status, date, payment method).
4. **`devices`**: Tracks the merchant's active Android soundbox device, notification permission status, and heartbeat.

### Security (Row Level Security)
- Every table has **RLS enabled** with strict policies ensuring merchants can only read, write, and modify their own records (`auth.uid() = user_id`).
- Includes PostgreSQL trigger `on_auth_user_created` that automatically generates the merchant record upon email registration.

### Connecting Your Supabase Project
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in Supabase and run the migration script: [`supabase/schema.sql`](supabase/schema.sql).
3. In DhwaniPay, tap **Supabase Setup** on the Sign In screen (or Settings ➜ Configure Supabase Database) and paste:
   - **Project URL**: `https://<your-project>.supabase.co`
   - **Anon Public Key**: `eyJhbGci...`
4. Register or log in with any merchant email! All incoming UPI payments and expenses will sync to Supabase automatically.

## Design tokens
The implementation follows the supplied DhwaniPay spec: primary emerald `#087F5B`, deep forest `#07533F`, mint `#DDF7EA`, warm white `#F7F9F6`, charcoal `#17231D`, muted sage `#6B7A70`, and warning/error colors. Dark-mode tokens are in `constants/theme.ts`.
