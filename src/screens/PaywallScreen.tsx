import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Card, useTheme, Snackbar, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSubscription } from '../context/SubscriptionContext';
import { FREE_LIST_LIMIT, FREE_WORDS_PER_LIST_LIMIT } from '../config/revenueCat';

interface Props {
  onDismiss: () => void;
}

const FEATURES = [
  { icon: 'folder-multiple', free: `Up to ${FREE_LIST_LIMIT} word lists`, premium: 'Unlimited word lists' },
  { icon: 'format-list-bulleted', free: `Up to ${FREE_WORDS_PER_LIST_LIMIT} words per list`, premium: 'Unlimited words per list' },
  { icon: 'calendar-check', free: 'Calendar scheduling', premium: 'Calendar scheduling' },
  { icon: 'microphone', free: 'Audio recordings', premium: 'Audio recordings' },
  { icon: 'sync', free: 'Cloud sync', premium: 'Cloud sync across devices' },
];

const PaywallScreen: React.FC<Props> = ({ onDismiss }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { purchasePremium, restorePurchases, offerings, isLoading } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const monthlyPackage = offerings?.current?.monthly;
  const price = monthlyPackage?.product?.priceString ?? '—';

  const handlePurchase = async () => {
    setPurchasing(true);
    const error = await purchasePremium();
    setPurchasing(false);
    if (error) setSnackbar(error);
    else onDismiss();
  };

  const handleRestore = async () => {
    setRestoring(true);
    const error = await restorePurchases();
    setRestoring(false);
    if (error) setSnackbar(error);
    else { setSnackbar('Purchases restored!'); setTimeout(onDismiss, 1500); }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 16 }]}>
        <IconButton icon="close" size={24} iconColor="#1C1700" onPress={onDismiss} style={styles.closeBtn} />
        <Text variant="headlineSmall" style={styles.headerTitle}>EasyWord Premium</Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>Unlock your full learning potential</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Feature comparison */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.comparisonHeader}>
              <Text style={[styles.colLabel, { color: theme.colors.onSurfaceVariant }]}>Feature</Text>
              <Text style={[styles.colLabel, { color: theme.colors.onSurfaceVariant }]}>Free</Text>
              <Text style={[styles.colLabel, { color: theme.colors.primary, fontWeight: 'bold' }]}>Premium</Text>
            </View>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureRow, i < FEATURES.length - 1 && styles.featureBorder]}>
                <View style={styles.featureLabel}>
                  <Icon name={f.icon as any} size={18} color={theme.colors.primary} />
                </View>
                <Text variant="bodySmall" style={[styles.colValue, { color: theme.colors.onSurfaceVariant }]}>{f.free}</Text>
                <View style={styles.colValue}>
                  <View style={styles.premiumCell}>
                    <Icon name="check-circle" size={14} color={theme.colors.primary} />
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurface, marginLeft: 4 }}>{f.premium}</Text>
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Price */}
        <View style={styles.priceBlock}>
          <Text variant="displaySmall" style={[styles.price, { color: theme.colors.primary }]}>{price}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>per month · cancel anytime</Text>
        </View>

        {/* Purchase button */}
        <Button
          mode="contained"
          onPress={handlePurchase}
          loading={purchasing}
          disabled={purchasing || restoring || isLoading}
          style={styles.purchaseBtn}
          contentStyle={styles.purchaseBtnContent}
          labelStyle={styles.purchaseBtnLabel}
        >
          Start Premium
        </Button>

        {/* Restore */}
        <Button
          mode="text"
          onPress={handleRestore}
          loading={restoring}
          disabled={purchasing || restoring}
          style={{ marginBottom: 8 }}
        >
          Restore Purchases
        </Button>

        <Text variant="bodySmall" style={[styles.legal, { color: theme.colors.onSurfaceVariant }]}>
          Payment will be charged to your App Store / Google Play account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 24, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  closeBtn: { alignSelf: 'flex-end', marginBottom: -8 },
  headerTitle: { fontWeight: 'bold', color: '#1C1700' },
  headerSubtitle: { color: 'rgba(28,23,0,0.6)', marginTop: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, marginBottom: 24 },
  comparisonHeader: { flexDirection: 'row', marginBottom: 12 },
  colLabel: { flex: 1, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  featureBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E9E3A0' },
  featureLabel: { flex: 1 },
  colValue: { flex: 1 },
  premiumCell: { flexDirection: 'row', alignItems: 'center' },
  priceBlock: { alignItems: 'center', marginBottom: 24 },
  price: { fontWeight: 'bold' },
  purchaseBtn: { marginBottom: 12, borderRadius: 12 },
  purchaseBtnContent: { paddingVertical: 6 },
  purchaseBtnLabel: { fontSize: 16, fontWeight: 'bold' },
  legal: { textAlign: 'center', fontSize: 11, lineHeight: 16, paddingHorizontal: 8 },
});

export default PaywallScreen;
