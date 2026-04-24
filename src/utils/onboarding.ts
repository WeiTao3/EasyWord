import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@EasyWord:hasSeenOnboarding';
const TAB_TOOLTIPS_KEY = '@EasyWord:seenTabTooltips';

export const hasSeenOnboarding = async (): Promise<boolean> => {
  const val = await AsyncStorage.getItem(ONBOARDING_KEY);
  return val === 'true';
};

export const markOnboardingSeen = async (): Promise<void> => {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
};

export const hasSeenTabTooltip = async (tabKey: string): Promise<boolean> => {
  const val = await AsyncStorage.getItem(TAB_TOOLTIPS_KEY);
  const seen: string[] = val ? JSON.parse(val) : [];
  return seen.includes(tabKey);
};

export const markTabTooltipSeen = async (tabKey: string): Promise<void> => {
  const val = await AsyncStorage.getItem(TAB_TOOLTIPS_KEY);
  const seen: string[] = val ? JSON.parse(val) : [];
  if (!seen.includes(tabKey)) {
    seen.push(tabKey);
    await AsyncStorage.setItem(TAB_TOOLTIPS_KEY, JSON.stringify(seen));
  }
};
