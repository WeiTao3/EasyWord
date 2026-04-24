import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOfferings } from 'react-native-purchases';
import {
  REVENUECAT_API_KEY_IOS,
  REVENUECAT_API_KEY_ANDROID,
  PREMIUM_ENTITLEMENT_ID,
  FREE_LIST_LIMIT,
  FREE_WORDS_PER_LIST_LIMIT,
  DEV_SIMULATE_PREMIUM,
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
    // In dev mode, skip RevenueCat entirely and use the simulation flag
    if (IS_DEV) {
      setIsPremium(DEV_SIMULATE_PREMIUM);
      setIsLoading(false);
      return;
    }
    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
    Purchases.configure({ apiKey });
  }, []);

  // Identify user with RevenueCat when logged in (production only)
  useEffect(() => {
    if (IS_DEV) return;
    if (!user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }
    const init = async () => {
      setIsLoading(true);
      try {
        await Purchases.logIn(user.id);
        const [customerInfo, fetchedOfferings] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        setIsPremium(!!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
        setOfferings(fetchedOfferings);
      } catch (e) {
        console.error('RevenueCat init error:', e);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      setIsPremium(!!info.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
    });
  }, [user]);

  const purchasePremium = async (): Promise<string | null> => {
    try {
      if (!offerings?.current?.monthly) return 'No offerings available.';
      const { customerInfo } = await Purchases.purchasePackage(offerings.current.monthly);
      setIsPremium(!!customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
      return null;
    } catch (e: any) {
      if (e.userCancelled) return null;
      return e.message ?? 'Purchase failed.';
    }
  };

  const restorePurchases = async (): Promise<string | null> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
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
