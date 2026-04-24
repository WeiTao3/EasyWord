import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { WordProvider } from './src/context/WordContext';
import { AuthProvider } from './src/context/AuthContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FACC15',
    primaryContainer: '#FEF9C3',
    secondary: '#A38000',
    secondaryContainer: '#FEF3C7',
    tertiary: '#B45309',
    tertiaryContainer: '#FDE68A',
    surface: '#FFFBFE',
    surfaceVariant: '#FEF9C3',
    background: '#FFFBFE',
    error: '#B3261E',
    errorContainer: '#F9DEDC',
    onPrimary: '#1C1700',
    onPrimaryContainer: '#1C1700',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1C1700',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#1C1700',
    onSurface: '#1C1B1F',
    onSurfaceVariant: '#49454F',
    onError: '#FFFFFF',
    onErrorContainer: '#410E0B',
    onBackground: '#1C1B1F',
    outline: '#79747E',
    outlineVariant: '#E9E3A0',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: 'transparent',
      level1: '#FEFCE8',
      level2: '#FEF9C3',
      level3: '#FEF08A',
      level4: '#FDE047',
      level5: '#FACC15',
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <PaperProvider theme={theme}>
        <LanguageProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <WordProvider>
                <StatusBar style="dark" />
                <AppNavigator />
              </WordProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </LanguageProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
