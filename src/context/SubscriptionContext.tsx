import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import type { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadPurchases = () => require('react-native-purchases').default as any;
import {
  REVENUECAT_API_KEY_IOS,
  REVENUECAT_API_KEY_ANDROID,
  PREMIUM_ENTITLEMENT_ID,
  FREE_LIST_LIMIT,
  FREE_WORDS_PER_LIST_LIMIT,
  DEV_SIMULATE_PREMIUM,
  DISABLE_REVENUECAT,
} from '../config/revenueCat';
import { useAuth } from './AuthContext';

const IS_DEV = __DEV__;

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  offerings: PurchasesOfferings | null;
  purchasePremium: () => Promise<string | null>;
  restorePurchases: () => Promise<string | null>;
  canAddList: (currentCount: number) => boolean;
  canAddWord: (wordsInList: number) => boolean;
  listLimit: number;
  wordLimit: number;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);

  useEffect(() => {
    // Skip RevenueCat in dev mode or when explicitly disabled (e.g. iOS 26 crash investigation)
    if (IS_DEV || DISABLE_REVENUECAT) {
      setIsPremium(DEV_SIMULATE_PREMIUM);
      setIsLoading(false);
      return;
    }
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    try {
      // Verbose logging so the device console explains *why* offerings are empty
      // (e.g. products not fetchable from App Store Connect). Dial back post-launch.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LOG_LEVEL } = require('react-native-purchases');
      loadPurchases().setLogLevel(LOG_LEVEL.VERBOSE);
      loadPurchases().configure({ apiKey });
    } catch (e) {
      console.error('RevenueCat configure error:', e);
    }
  }, []);

  // Identify user with RevenueCat when logged in (production only)
  useEffect(() => {
    if (IS_DEV || DISABLE_REVENUECAT) return;
    if (!user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }
    const init = async () => {
      setIsLoading(true);
      try {
        await loadPurchases().logIn(user.id);
        const [customerInfo, fetchedOfferings] = await Promise.all([
          loadPurchases().getCustomerInfo(),
          loadPurchases().getOfferings(),
        ]);
        setIsPremium(!!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
        setOfferings(fetchedOfferings);
        // Diagnostic: surface what RevenueCat actually returned so empty paywalls
        // can be debugged from the device console.
        console.log('[RC] offerings:', JSON.stringify({
          current: fetchedOfferings?.current?.identifier ?? null,
          allOfferings: Object.keys(fetchedOfferings?.all ?? {}),
          currentPackages: fetchedOfferings?.current?.availablePackages?.map((p: any) => p.identifier) ?? [],
          hasMonthly: !!fetchedOfferings?.current?.monthly,
        }));
      } catch (e) {
        console.error('RevenueCat init error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    loadPurchases().addCustomerInfoUpdateListener((info: CustomerInfo) => {
      setIsPremium(!!info.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
    });
  }, [user]);

  const purchasePremium = async (): Promise<string | null> => {
    try {
      // Prefer the Monthly-typed package, but fall back to the first available
      // package so a correctly-configured offering still works even if the package
      // wasn't tagged "Monthly" in the RevenueCat dashboard.
      const pkg = offerings?.current?.monthly ?? offerings?.current?.availablePackages?.[0];
      if (!pkg) return 'No offerings available.';
      const { customerInfo } = await loadPurchases().purchasePackage(pkg);
      setIsPremium(!!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
      return null;
    } catch (e: any) {
      if (e.userCancelled) return null;
      return e.message ?? 'Purchase failed.';
    }
  };

  const restorePurchases = async (): Promise<string | null> => {
    try {
      const customerInfo = await loadPurchases().restorePurchases();
      setIsPremium(!!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
      return null;
    } catch (e: any) {
      return e.message ?? 'Restore failed.';
    }
  };

  const canAddList = (currentCount: number) => isPremium || currentCount < FREE_LIST_LIMIT;
  const canAddWord = (wordsInList: number) => isPremium || wordsInList < FREE_WORDS_PER_LIST_LIMIT;

  return (
    <SubscriptionContext.Provider value={{
      isPremium, isLoading, offerings,
      purchasePremium, restorePurchases,
      canAddList, canAddWord,
      listLimit: FREE_LIST_LIMIT,
      wordLimit: FREE_WORDS_PER_LIST_LIMIT,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error('useSubscription must be used within SubscriptionProvider');
  return context;
};
