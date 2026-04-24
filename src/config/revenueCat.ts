// Replace these with your actual RevenueCat API keys from app.revenuecat.com
export const REVENUECAT_API_KEY_IOS = 'appl_YOUR_IOS_KEY_HERE';
export const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_ANDROID_KEY_HERE';

// ── Dev simulation ────────────────────────────────────────────────────────────
// Set to true to simulate premium, false to simulate free tier during development
// Has no effect in production builds
export const DEV_SIMULATE_PREMIUM = true;

// Product identifier — must match what you create in App Store Connect / Google Play
export const PREMIUM_PRODUCT_ID = 'easyword_premium_monthly';
export const PREMIUM_ENTITLEMENT_ID = 'premium';

// Free tier limits
export const FREE_LIST_LIMIT = 15;
export const FREE_WORDS_PER_LIST_LIMIT = 35;
