// Replace these with your actual RevenueCat API keys from app.revenuecat.com
export const REVENUECAT_API_KEY_IOS = 'appl_dCCrqmYBVJnooOUwmVWlotyTIEA';
export const REVENUECAT_API_KEY_ANDROID = 'goog_FLycJKwtpuYePfWDveGRicuViaq';

// ── Dev simulation ────────────────────────────────────────────────────────────
// Set to true to simulate premium, false to simulate free tier during development
// Has no effect in production builds
export const DEV_SIMULATE_PREMIUM = false;

// ── iOS 26 crash investigation ────────────────────────────────────────────────
// Set to true to disable RevenueCat entirely (all users treated as free tier).
// Use to isolate whether RevenueCat is causing the iOS 26 launch crash.
export const DISABLE_REVENUECAT = true;

// Product identifier — must match what you create in App Store Connect / Google Play
export const PREMIUM_PRODUCT_ID = 'easyword_premium_monthly';
export const PREMIUM_ENTITLEMENT_ID = 'premium';

// Free tier limits
export const FREE_LIST_LIMIT = 15;
export const FREE_WORDS_PER_LIST_LIMIT = 35;
