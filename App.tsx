import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text } from 'react-native';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { WordProvider } from './src/context/WordContext';
import { AuthProvider } from './src/context/AuthContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { LanguageProvider } from './src/context/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';

// Prevent uncaught JS exceptions from causing SIGABRT in release mode.
// In development React Native shows a red error screen; in production it calls abort().
// This handler keeps the app alive so the ErrorBoundary or a graceful UI can show instead.
if (!__DEV__) {
  const g = global as any;
  if (g.ErrorUtils) {
    g.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.error('[Uncaught]', error?.message ?? String(error), 'fatal:', isFatal);
    });
  }
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error: error?.message ?? 'Unknown error' };
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#FFFBFE' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1C1700', marginBottom: 12 }}>EasyWord</Text>
          <Text style={{ fontSize: 14, color: '#49454F', textAlign: 'center' }}>
            Something went wrong. Please restart the app.
          </Text>
          <Text style={{ fontSize: 11, color: '#79747E', textAlign: 'center', marginTop: 16 }}>
            {this.state.error}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
