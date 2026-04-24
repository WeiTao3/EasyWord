import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert, Linking } from 'react-native';
import {
  Surface,
  Text,
  Card,
  List,
  useTheme,
  Chip,
  Snackbar,
  ActivityIndicator,
  Button,
  TextInput,
  IconButton,
  Portal,
  Dialog,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useWords } from '../context/WordContext';
import PaywallScreen from './PaywallScreen';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { exportWordsAsText } from '../services/fileService';
import { InstalledDictionary } from '../types';
import AVAILABLE_DICTIONARIES from '../data/availableDictionaries';
import FeedbackButton from '../components/FeedbackButton';
import TabTooltip from '../components/TabTooltip';
import OnboardingCarousel from '../components/OnboardingCarousel';
import { useLanguage } from '../context/LanguageContext';

const SettingsScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, updateSettings } = useWords();
  const { user, signOut, deleteAccount } = useAuth();
  const { isPremium, listLimit, wordLimit } = useSubscription();
  const { language, setLanguage, t } = useLanguage();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  const [isExportingText, setIsExportingText] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const error = await deleteAccount();
    setDeleteLoading(false);
    if (error) {
      setDeleteDialogVisible(false);
      Alert.alert('Error', error);
    }
    // On success: onAuthStateChange fires (user = null) → app navigates to AuthScreen
  };

  // Dictionary management
  const [addDictDialogVisible, setAddDictDialogVisible] = useState(false);
  const [installingDictId, setInstallingDictId] = useState<string | null>(null);

  const installedIds = new Set(state.settings.installedDictionaries.map((d) => d.id));
  const availableToAdd = AVAILABLE_DICTIONARIES.filter((d) => !installedIds.has(d.id));

  const handleInstallDict = async (dict: typeof AVAILABLE_DICTIONARIES[0]) => {
    setInstallingDictId(dict.id);
    // Brief simulated install delay — gives "download" feel and implicitly tests connectivity
    await new Promise((r) => setTimeout(r, 900));
    const newDict: InstalledDictionary = {
      id: dict.id,
      sourceLang: dict.sourceLang,
      targetLang: dict.targetLang,
      sourceName: dict.sourceName,
      targetName: dict.targetName,
      sourceFlag: dict.sourceFlag,
      targetFlag: dict.targetFlag,
    };
    updateSettings({
      installedDictionaries: [...state.settings.installedDictionaries, newDict],
    });
    setInstallingDictId(null);
  };

  const handleRemoveDict = (id: string) => {
    const remaining = state.settings.installedDictionaries.filter((d) => d.id !== id);
    const newActive =
      state.settings.activeDictionaryId === id
        ? (remaining[0]?.id ?? '')
        : state.settings.activeDictionaryId;
    updateSettings({ installedDictionaries: remaining, activeDictionaryId: newActive });
  };

  const handleSetActiveDict = (id: string) => {
    updateSettings({ activeDictionaryId: id });
  };

  // Review schedule editing
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [draftIntervals, setDraftIntervals] = useState<string[]>([]);
  const [intervalErrors, setIntervalErrors] = useState<string[]>([]);

  const handleEditSchedule = () => {
    setDraftIntervals(state.settings.reviewIntervals.map(String));
    setIntervalErrors(state.settings.reviewIntervals.map(() => ''));
    setEditingSchedule(true);
  };

  const handleIntervalChange = (index: number, value: string) => {
    const updated = [...draftIntervals];
    updated[index] = value;
    setDraftIntervals(updated);
    const updatedErrors = [...intervalErrors];
    updatedErrors[index] = '';
    setIntervalErrors(updatedErrors);
  };

  const handleSaveSchedule = () => {
    const nums = draftIntervals.map((s) => parseInt(s, 10));
    const errors = draftIntervals.map((s, i) => {
      const n = parseInt(s, 10);
      if (!s.trim() || isNaN(n) || n <= 0) return 'Must be > 0';
      if (i > 0 && n <= nums[i - 1]) return `Must be > ${nums[i - 1]}`;
      return '';
    });
    setIntervalErrors(errors);
    if (errors.some((e) => e)) return;
    updateSettings({ reviewIntervals: nums });
    setEditingSchedule(false);
    setSnackbarMessage('Review schedule updated');
    setSnackbarVisible(true);
  };

  const reviewCount = state.settings.reviewIntervals.length;
  const totalWords = state.words.length;
  const mastered = state.lists.reduce((sum, list) => {
    const checkCount = (state.checkedListDates[list.id] || []).length;
    if (checkCount >= reviewCount) {
      return sum + state.words.filter((w) => w.listId === list.id).length;
    }
    return sum;
  }, 0);
  const inProgress = state.lists.reduce((sum, list) => {
    const checkCount = (state.checkedListDates[list.id] || []).length;
    if (checkCount < reviewCount) {
      return sum + state.words.filter((w) => w.listId === list.id).length;
    }
    return sum;
  }, 0);

  const handleExportText = async () => {
    if (state.words.length === 0) {
      setSnackbarMessage('Add some words before exporting');
      setSnackbarVisible(true);
      return;
    }
    setIsExportingText(true);
    try {
      await exportWordsAsText(state.words, state.lists);
      setSnackbarMessage('Vocabulary exported as text');
    } catch (error) {
      setSnackbarMessage('Failed to export vocabulary');
    } finally {
      setIsExportingText(false);
      setSnackbarVisible(true);
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface
        style={[
          styles.header,
          { backgroundColor: theme.colors.primary, paddingTop: insets.top + 16 },
        ]}
        elevation={0}
      >
        <View style={styles.headerRow}>
          <Text variant="headlineMedium" style={styles.title}>
            {t.settings.title}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
              icon="help-circle-outline"
              iconColor="#1C1700"
              size={22}
              onPress={() => setOnboardingVisible(true)}
              style={{ margin: 0 }}
            />
            <FeedbackButton />
          </View>
        </View>
      </Surface>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Statistics */}
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t.settings.statistics}
        </Text>
        <Card style={styles.statsCard} mode="elevated">
          <Card.Content>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Icon name="book-alphabet" size={24} color={theme.colors.primary} />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>
                  {totalWords}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t.settings.total}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="trophy" size={24} color="#4CAF50" />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                  {mastered}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t.settings.mastered}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="progress-clock" size={24} color="#FF9800" />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: '#FF9800' }}>
                  {inProgress}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t.settings.inProgress}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Data Management */}
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t.settings.dataManagement}
        </Text>

        {/* Language Selector */}
        <Card style={styles.menuCard} mode="elevated">
          <List.Item
            title={t.settings.language}
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={() => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 }}>
                <Button
                  mode={language === 'en' ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setLanguage('en')}
                >
                  English
                </Button>
                <Button
                  mode={language === 'zh' ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setLanguage('zh')}
                >
                  中文
                </Button>
              </View>
            )}
          />
        </Card>

        <Card style={styles.menuCard} mode="elevated">
          <List.Item
            title={t.settings.account}
            description={user?.email ?? ''}
            left={(props) => <List.Icon {...props} icon="account-circle" />}
          />
          <List.Item
            title={isPremium ? t.settings.premiumMember : t.settings.freePlan}
            description={isPremium
              ? t.settings.unlimitedListsAndWords
              : t.settings.listsUsed(state.lists.length, listLimit)}
            left={(props) => <List.Icon {...props} icon={isPremium ? 'crown' : 'crown-outline'} />}
            right={() => !isPremium
              ? <Button mode="contained" compact onPress={() => setPaywallVisible(true)}>{t.common.upgrade}</Button>
              : null}
          />
          <List.Item
            title={t.settings.signOut}
            left={(props) => <List.Icon {...props} icon="logout" color="#B3261E" />}
            titleStyle={{ color: '#B3261E' }}
            onPress={signOut}
          />
          <List.Item
            title={t.settings.deleteAccount}
            left={(props) => <List.Icon {...props} icon="delete-forever" color={theme.colors.error} />}
            titleStyle={{ color: theme.colors.error }}
            onPress={() => setDeleteDialogVisible(true)}
          />
        </Card>

        <Card style={styles.menuCard} mode="elevated">
          <List.Item
            title={t.settings.exportAsText}
            description={t.settings.exportDescription}
            left={(props) => <List.Icon {...props} icon="file-document-outline" />}
            right={() =>
              isExportingText ? (
                <ActivityIndicator size="small" />
              ) : (
                <List.Icon icon="chevron-right" />
              )
            }
            onPress={handleExportText}
            disabled={isExportingText}
          />
        </Card>

        {/* Dictionary */}
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t.settings.dictionaries}
        </Text>
        <Card style={styles.menuCard} mode="elevated">
          <Card.Content>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
              {t.settings.dictionaryHint}
            </Text>
            {state.settings.installedDictionaries.map((d, i) => {
              const isActive = d.id === state.settings.activeDictionaryId;
              return (
                <React.Fragment key={d.id}>
                  {i > 0 && <Divider />}
                  <List.Item
                    title={`${d.sourceFlag} ${d.sourceName}  →  ${d.targetFlag} ${d.targetName}`}
                    titleStyle={isActive ? { color: theme.colors.primary, fontWeight: 'bold' } : undefined}
                    left={() => (
                      <Icon
                        name={isActive ? 'radiobox-marked' : 'radiobox-blank'}
                        size={22}
                        color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        style={{ alignSelf: 'center', marginLeft: 8 }}
                      />
                    )}
                    right={() =>
                      state.settings.installedDictionaries.length > 1 ? (
                        <IconButton
                          icon="delete-outline"
                          size={18}
                          iconColor={theme.colors.error}
                          onPress={() => handleRemoveDict(d.id)}
                          style={{ margin: 0 }}
                        />
                      ) : null
                    }
                    onPress={() => handleSetActiveDict(d.id)}
                  />
                </React.Fragment>
              );
            })}
            <Divider style={{ marginVertical: 4 }} />
            <Button
              icon="download"
              mode="text"
              onPress={() => setAddDictDialogVisible(true)}
              disabled={availableToAdd.length === 0}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            >
              {t.settings.addDictionary}
            </Button>
          </Card.Content>
        </Card>

        {/* Review Schedule */}
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t.settings.reviewSchedule}
        </Text>
        <Card style={styles.scheduleCard} mode="elevated">
          <Card.Content>
            <View style={styles.scheduleHeaderRow}>
              <Text variant="bodyMedium" style={{ flex: 1 }}>
                {t.settings.reviewIntervalPrefix}
              </Text>
              {editingSchedule ? (
                <View style={styles.scheduleActions}>
                  <Button compact mode="text" onPress={() => setEditingSchedule(false)}>
                    {t.common.cancel}
                  </Button>
                  <Button compact mode="contained" onPress={handleSaveSchedule}>
                    {t.common.save}
                  </Button>
                </View>
              ) : (
                <IconButton
                  icon="pencil"
                  size={18}
                  onPress={handleEditSchedule}
                  style={{ margin: 0 }}
                />
              )}
            </View>

            {editingSchedule ? (
              <View style={styles.intervalsEditContainer}>
                {draftIntervals.map((val, i) => (
                  <View key={i} style={styles.intervalEditItem}>
                    <TextInput
                      label={`#${i + 1}`}
                      value={val}
                      onChangeText={(v) => handleIntervalChange(i, v)}
                      mode="outlined"
                      keyboardType="numeric"
                      dense
                      error={!!intervalErrors[i]}
                      style={styles.intervalInput}
                    />
                    {intervalErrors[i] ? (
                      <Text variant="labelSmall" style={{ color: theme.colors.error, marginTop: 2 }}>
                        {intervalErrors[i]}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.intervalsContainer}>
                {state.settings.reviewIntervals.map((day, i) => (
                  <Chip key={i} style={styles.intervalChip} compact>
                    {day} {language === 'zh' ? '天' : (day !== 1 ? 'days' : 'day')}
                  </Chip>
                ))}
              </View>
            )}

            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}
            >
              {t.settings.reviewIntervalSuffix(state.settings.reviewIntervals.length)}
            </Text>
          </Card.Content>
        </Card>

        {/* About */}
        <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          {t.settings.about}
        </Text>
        <Card style={styles.aboutCard} mode="elevated">
          <Card.Content style={styles.aboutContent}>
            <Icon name="book-education" size={48} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ marginTop: 12, fontWeight: 'bold' }}>
              EasyWord
            </Text>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t.settings.version}
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: 12,
                lineHeight: 20,
              }}
            >
              {t.settings.appDescription}
            </Text>
            <Button
              mode="text"
              compact
              onPress={() => Linking.openURL('https://weitao3.github.io/easyword-privacy/')}
              style={{ marginTop: 8 }}
            >
              {t.settings.privacyPolicy}
            </Button>
          </Card.Content>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

      {paywallVisible && (
        <View style={StyleSheet.absoluteFill}>
          <PaywallScreen onDismiss={() => setPaywallVisible(false)} />
        </View>
      )}

      {/* Add Dictionary Dialog */}
      <Portal>
        <Dialog
          visible={addDictDialogVisible}
          onDismiss={() => !installingDictId && setAddDictDialogVisible(false)}
        >
          <Dialog.Title>{t.settings.addDictionary}</Dialog.Title>
          <Dialog.Content style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
            <Divider />
            <FlatList
              data={availableToAdd}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <Divider />}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const isInstalling = installingDictId === item.id;
                return (
                  <List.Item
                    title={`${item.sourceFlag} ${item.sourceName}  →  ${item.targetFlag} ${item.targetName}`}
                    right={() =>
                      isInstalling ? (
                        <ActivityIndicator size="small" style={{ marginRight: 8 }} />
                      ) : (
                        <Button
                          compact
                          mode="contained-tonal"
                          icon="download"
                          disabled={!!installingDictId}
                          onPress={() => handleInstallDict(item)}
                        >
                          {t.settings.addDictionary.split(' ')[0]}
                        </Button>
                      )
                    }
                  />
                );
              }}
            />
            <Divider />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDictDialogVisible(false)} disabled={!!installingDictId}>
              {t.common.done}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => !deleteLoading && setDeleteDialogVisible(false)}>
          <Dialog.Title>{t.settings.deleteAccount}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              {t.settings.deleteAccountMessage}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)} disabled={deleteLoading}>
              {t.common.cancel}
            </Button>
            <Button
              textColor={theme.colors.error}
              loading={deleteLoading}
              disabled={deleteLoading}
              onPress={handleDeleteAccount}
            >
              {t.common.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <TabTooltip
        tabKey="settings"
        icon="cog"
        message="Adjust your review intervals, manage dictionaries, and export your vocabulary here."
      />

      <OnboardingCarousel
        visible={onboardingVisible}
        onDone={() => setOnboardingVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#1C1700',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuCard: {
    marginBottom: 8,
  },
  scheduleCard: {
    marginBottom: 8,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  intervalsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalChip: {
    marginRight: 4,
  },
  intervalsEditContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intervalEditItem: {
    flex: 1,
    minWidth: 64,
  },
  intervalInput: {
    textAlign: 'center',
  },
  aboutCard: {
    marginBottom: 8,
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});

export default SettingsScreen;
