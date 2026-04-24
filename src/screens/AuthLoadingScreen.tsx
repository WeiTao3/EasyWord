import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

const AuthLoadingScreen: React.FC = () => (
  <View style={styles.container}>
    <Text variant="headlineMedium" style={styles.title}>EasyWord</Text>
    <ActivityIndicator size="large" color="#FACC15" style={styles.spinner} />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFBFE' },
  title: { fontWeight: 'bold', color: '#1C1700', marginBottom: 32 },
  spinner: { marginTop: 8 },
});

export default AuthLoadingScreen;
