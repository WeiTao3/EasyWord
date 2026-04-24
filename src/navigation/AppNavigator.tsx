import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import OnboardingCarousel from '../components/OnboardingCarousel';
import { useLanguage } from '../context/LanguageContext';
import { hasSeenOnboarding, markOnboardingSeen } from '../utils/onboarding';

import HomeScreen from '../screens/HomeScreen';
import AddWordScreen from '../screens/AddWordScreen';
import WordListScreen from '../screens/WordListScreen';
import ListDetailScreen from '../screens/ListDetailScreen';
import ReviewScreen from '../screens/ReviewScreen';
import CalendarDayScreen from '../screens/CalendarDayScreen';
import RecordScreen from '../screens/RecordScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator<any>();
const Stack = createStackNavigator<any>();

const ListStack = () => (
  <Stack.Navigator id="ListStack" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WordList" component={WordListScreen} />
    <Stack.Screen name="ListDetail" component={ListDetailScreen} />
    <Stack.Screen name="RecordScreen" component={RecordScreen} />
  </Stack.Navigator>
);

const ReviewStack = () => (
  <Stack.Navigator id="ReviewStack" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Calendar" component={ReviewScreen} />
    <Stack.Screen name="CalendarDay" component={CalendarDayScreen} />
    <Stack.Screen name="ListDetail" component={ListDetailScreen} />
    <Stack.Screen name="RecordScreen" component={RecordScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => {
  const theme = useTheme();
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 80,
          paddingTop: 8,
          paddingBottom: 24,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t.tabs.resource,
          tabBarIcon: ({ color, size }) => <Icon name="book-play" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AddTab"
        component={AddWordScreen}
        options={{
          tabBarLabel: t.tabs.add,
          tabBarIcon: ({ color, size }) => <Icon name="plus-circle" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ListTab"
        component={ListStack}
        options={{
          tabBarLabel: t.tabs.lists,
          tabBarIcon: ({ color, size }) => <Icon name="folder-multiple" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ReviewTab"
        component={ReviewStack}
        options={{
          tabBarLabel: t.tabs.review,
          tabBarIcon: ({ color, size }) => <Icon name="head-lightbulb" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: t.tabs.settings,
          tabBarIcon: ({ color, size }) => <Icon name="cog" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { session, isLoading } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (session) {
      hasSeenOnboarding().then((seen) => {
        if (!seen) setShowOnboarding(true);
      });
    }
  }, [session]);

  const handleOnboardingDone = async () => {
    await markOnboardingSeen();
    setShowOnboarding(false);
  };

  if (isLoading) return <AuthLoadingScreen />;
  return (
    <NavigationContainer>
      {session ? <TabNavigator /> : <AuthScreen />}
      <OnboardingCarousel visible={showOnboarding} onDone={handleOnboardingDone} />
    </NavigationContainer>
  );
};

export default AppNavigator;
