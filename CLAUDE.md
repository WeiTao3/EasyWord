# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server (choose platform)
npx expo start
npx expo start --ios
npx expo start --android

# Type-check (no test suite exists)
npx tsc --noEmit --skipLibCheck

# Fetch/update pre-bundled transcripts (run from /Users/weitao/Desktop/EasyWord/, not EasyWord/)
node fetchTranscripts.mjs              # skip already-fetched
node fetchTranscripts.mjs --force      # re-fetch all
node fetchTranscripts.mjs <videoId>    # single video
```

Environment variables required: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (set in `.env`).

To simulate premium in development, toggle `DEV_SIMULATE_PREMIUM` in `src/config/revenueCat.ts`.

## Architecture

### Tech Stack
- **Expo** (SDK 54, New Architecture enabled) + **React Native** 0.81
- **react-native-paper** for all UI components (Material Design 3)
- **Supabase** for auth + database (cloud-synced per user)
- **RevenueCat** for in-app purchases (premium subscription)
- **AsyncStorage** for local-only state (settings, transcripts cache, onboarding flags)

### Data Flow

All app state lives in `WordContext` (`src/context/WordContext.tsx`), which is a `useReducer`-based store with actions defined in `src/types/index.ts`. On mount it loads from Supabase (auth-gated), falls back to AsyncStorage for settings. Every mutation dispatches an action AND calls the corresponding Supabase function in `src/services/supabaseDataService.ts`.

There are three contexts:
- `AuthContext` — Supabase session, exposes sign-in methods (email, Google, Apple)
- `WordContext` — all words, lists, calendar entries, review schedules; depends on `AuthContext`
- `SubscriptionContext` — RevenueCat premium status; in `__DEV__` mode uses `DEV_SIMULATE_PREMIUM` flag instead

### Navigation

Bottom tab navigator (5 tabs: Resource, Add, Lists, Review, Settings). Two stacks inside tabs:
- **ListStack**: WordList → ListDetail → RecordScreen
- **ReviewStack**: Calendar → CalendarDay → ListDetail → RecordScreen

`ListDetail` and `RecordScreen` are accessible from both the Lists and Review flows.

Onboarding carousel is rendered in `AppNavigator` as an overlay, visible once after first login (flag stored in AsyncStorage via `src/utils/onboarding.ts`).

### Spaced Repetition

Default intervals: `[1, 2, 4, 7]` days. After 4 reviews a word is "mastered". Logic in `src/utils/spacedRepetition.ts`. Intervals are user-configurable in Settings and stored in Supabase + AsyncStorage.

### Supabase Tables

| Table | Purpose |
|---|---|
| `words` | All user words (snake_case columns, mapped in `supabaseDataService.ts`) |
| `word_lists` | Word lists with optional `list_no` (used in calendar scheduling) |
| `calendar_entries` | `(user_id, entry_date, list_no)` — which lists are scheduled on which dates |
| `checked_list_dates` | `(user_id, list_id, checked_date)` — review completion tracking |
| `feedback` | User-submitted feedback text |

All queries are scoped to `user_id`. Row-level security enforced server-side.

### Resource Screen (HomeScreen)

Displays YouTube videos from `src/data/ieltResources.ts` with live-synced transcripts. Three channels:
- **celpip** — CELPIP listening mock tests; transcripts pre-bundled in `src/data/transcripts.json`
- **bbc** — BBC 6 Minute English Box Sets (67 videos); transcripts fetched on-demand
- **voa** — VOA News Words (447 videos); **no captions available** on YouTube

Transcript loading (in `src/utils/transcriptUtils.ts`) uses a 3-tier approach:
1. Check `src/data/transcripts.json` (pre-bundled, CELPIP only)
2. Check AsyncStorage cache (keyed `@EasyWord:transcript:<videoId>`)
3. Fetch from YouTube: scrape `captionTracks` from watch page HTML, then fetch timedtext URL with `&fmt=json3`

**Note:** The dev machine may be rate-limited (HTTP 429) by the YouTube timedtext API. This resolves on real user devices.

### Premium Limits (Free Tier)

- 15 lists max (`FREE_LIST_LIMIT`)
- 35 words per list max (`FREE_WORDS_PER_LIST_LIMIT`)

Enforced via `SubscriptionContext.canAddList()` and `canAddWord()`, checked before mutations in the screens.

### Adding New Resources

1. Add entries to `src/data/ieltResources.ts` with the appropriate `channel` value
2. For CELPIP videos (which have transcripts you want to pre-bundle), run `fetchTranscripts.mjs` from the parent directory (`/Users/weitao/Desktop/EasyWord/`)
3. VOA videos have no captions — don't attempt transcript fetching for them
