import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Fail loudly with an actionable message if the env vars weren't embedded in the
// build. Missing EXPO_PUBLIC_* vars (e.g. not configured for the EAS build profile's
// environment) otherwise surface as a cryptic "supabaseUrl is required" crash on launch.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase env vars are missing (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY). ' +
      'For EAS builds, configure them via `eas env:create` and set the build profile\'s ' +
      '`environment` in eas.json; locally, set them in .env.'
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
