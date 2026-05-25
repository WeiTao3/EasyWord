# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server
npx expo start
npx expo start --ios
npx expo start --android
npx expo start --go          # Force Expo Go (no dev build required)

# Type-check
npx tsc --noEmit --skipLibCheck

# EAS builds
eas build --platform ios --profile development    # Dev build (install on device)
eas build --platform ios --profile production     # App Store build
eas build --platform android --profile production # Google Play build
eas submit --platform ios                         # Upload to App Store Connect

# Fetch/update pre-bundled CELPIP transcripts (run from /Users/weitao/Desktop/EasyWord/, not EasyWord/)
node fetchTranscripts.mjs              # skip already-fetched
node fetchTranscripts.mjs --force      # re-fetch all
node fetchTranscripts.mjs <videoId>    # single video
```

Environment variables required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (set in `.env`).

To simulate premium in development, toggle `DEV_SIMULATE_PREMIUM` in `src/config/revenueCat.ts`.

Before each EAS production build: ensure `DEV_SIMULATE_PREMIUM = false`, increment `ios.buildNumber` in `app.json` (App Store Connect rejects reused build numbers), commit and push all changes.

## Architecture

### Tech Stack
- **Expo SDK 54** (New Architecture **disabled** — `newArchEnabled: false` for iPadOS 26 compatibility) + **React Native 0.81.5**
- **react-native-paper** for all UI (Material Design 3)
- **Supabase** for auth + database + audio storage (cloud-synced per user)
- **RevenueCat** for in-app purchases (premium subscription)
- **AsyncStorage** for local-only state (settings, transcript cache, onboarding flags)
- **ExpoSecureStore** adapter for Supabase auth token persistence

### Context Hierarchy

```
ErrorBoundary
└─ PaperProvider (MD3 theme: primary #FACC15 golden yellow)
   └─ LanguageProvider (en/zh, device-detected, AsyncStorage-persisted)
      └─ AuthProvider (Supabase session + auth methods)
         └─ SubscriptionProvider (RevenueCat isPremium, offerings)
            └─ WordProvider (useReducer — all app state)
               └─ AppNavigator
```

**WordContext** is the single source of truth. Every mutation dispatches an action (types in `src/types/index.ts`) AND calls the corresponding Supabase function in `src/services/supabaseDataService.ts`. On login, loads all data from Supabase; on logout, resets to `initialState`.

### Navigation

Bottom tab navigator (5 tabs: Resource, Add, Lists, Review, Settings). Two stacks share `ListDetail` and `RecordScreen`:
- **ListStack**: WordList → ListDetail → RecordScreen
- **ReviewStack**: Calendar → CalendarDay → ListDetail → RecordScreen

Special flows handled in `AppNavigator`:
- `isLoading` → `AuthLoadingScreen` (with 5-second timeout fallback to prevent blank screen)
- `needsPasswordReset` (set by `PASSWORD_RECOVERY` Supabase event) → `AuthScreen` in `new-password` mode
- First login → `OnboardingCarousel` overlay (not in navigation stack)

### Authentication

`AuthContext` (`src/context/AuthContext.tsx`) exposes:
- **Email:** `signUpWithEmail` → clears temp session → OTP verify flow
- **Google:** `signInWithGoogle` — browser OAuth via `expo-web-browser`; tokens are in URL **fragment** (`#`), not query string — parsed manually
- **Apple:** `signInWithApple` — native via `expo-apple-authentication`; token passed to `supabase.auth.signInWithIdToken`
- **Password reset:** `sendPasswordReset` → `verifyResetOtp` → `updatePassword`; Supabase fires `PASSWORD_RECOVERY` event which sets `needsPasswordReset = true` to prevent auto-login before new password is set

### Supabase Tables

| Table | Purpose |
|---|---|
| `words` | All user words (snake_case columns mapped in `supabaseDataService.ts`) |
| `word_lists` | Word lists with optional `list_no` (used for calendar scheduling) |
| `calendar_entries` | `(user_id, entry_date, list_no)` — lists scheduled on dates |
| `checked_list_dates` | `(user_id, list_id, checked_date)` — review completion tracking |
| `feedback` | User-submitted feedback text |

All queries scoped to `user_id`. Audio stored in Supabase bucket `EasyWordPremiumAudio` at `{userId}/{wordId}.m4a`; signed URL (365-day) saved as `word.audioUri`. When a word is deleted, `deleteAudio` is called if `audioUri` starts with `https://`.

### Spaced Repetition

Default intervals: `[1, 2, 4, 7]` days (user-configurable). After 4 reviews a word is "mastered". Logic in `src/utils/spacedRepetition.ts`. Calendar scheduling uses intervals directly as offsets from today (today+1, today+2, today+4, today+7). All date calculations use local timezone via `src/utils/dateUtils.ts` — never `toISOString()` which is UTC.

### Premium / RevenueCat

- Free limits: 15 lists (`FREE_LIST_LIMIT`), 35 words/list (`FREE_WORDS_PER_LIST_LIMIT`)
- Enforced via `canAddList()` / `canAddWord()` in `SubscriptionContext` before mutations
- Entitlement ID: `premium` | Product ID: `easyword_premium_monthly`
- `DEV_SIMULATE_PREMIUM = true` bypasses SDK entirely in dev

### Resource Screen

Displays YouTube videos from `src/data/ieltResources.ts` (40 CELPIP + 67 BBC + 447 VOA). Transcript loading (`src/utils/transcriptUtils.ts`) uses 3-tier approach:
1. Pre-bundled `src/data/transcripts.json` (CELPIP only)
2. AsyncStorage cache (`@EasyWord:transcript:<videoId>`)
3. Live YouTube fetch (scrape captionTracks from watch page HTML)

VOA videos have no captions — don't attempt transcript fetching for them. Dev machine may be rate-limited (HTTP 429) by YouTube; resolves on real user devices.

### iOS Build Notes

`plugins/withCxxFlags.js` injects a `post_install` Ruby hook into the iOS Podfile that patches `boost/container_hash/hash.hpp` and `RCT-Folly-prefix.pch` to fix a C++17 `std::unary_function` removal issue. This runs during `expo prebuild` on EAS. `scripts/patchBoost.js` (npm `postinstall`) applies the same patches locally if `ios/Pods/` exists.

EAS builds exclusively from committed GitHub code — local uncommitted changes are invisible to EAS.
