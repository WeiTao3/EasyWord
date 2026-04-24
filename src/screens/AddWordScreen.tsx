import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import {
  Surface,
  Text,
  TextInput,
  Button,
  useTheme,
  Snackbar,
  Card,
  RadioButton,
  Divider,
  Chip,
  Menu,
  TouchableRipple,
  Portal,
  Dialog,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useWords } from '../context/WordContext';
import { useSubscription } from '../context/SubscriptionContext';
import PaywallScreen from './PaywallScreen';
import { getToday } from '../utils/dateUtils';
import { lookupWord } from '../services/dictionaryApi';
import FeedbackButton from '../components/FeedbackButton';
import TabTooltip from '../components/TabTooltip';
import OnboardingCarousel from '../components/OnboardingCarousel';
import { DictionaryResult } from '../types';
import { useLanguage } from '../context/LanguageContext';

const getMostRecentListId = (lists: { id: string; dateCreated: string }[]): string => {
  if (lists.length === 0) return 'default';
  return [...lists].sort(
    (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  )[0].id;
};

const AddWordScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addWord, addList, state, updateSettings } = useWords();
  const { canAddWord, wordLimit } = useSubscription();
  const { t } = useLanguage();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [source, setSource] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<DictionaryResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string>('');
  const [dictMenuVisible, setDictMenuVisible] = useState(false);

  const activeDict = state.settings.installedDictionaries.find(
    (d) => d.id === state.settings.activeDictionaryId
  ) ?? state.settings.installedDictionaries[0];

  // List selector — default to most recently created list
  const [selectedListId, setSelectedListId] = React.useState(() =>
    getMostRecentListId(state.lists)
  );
  const [listMenuVisible, setListMenuVisible] = useState(false);
  const [newListDialogVisible, setNewListDialogVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListNo, setNewListNo] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [listNoError, setListNoError] = useState('');

  // Keep selection valid if lists change
  React.useEffect(() => {
    if (!state.lists.find((l) => l.id === selectedListId)) {
      setSelectedListId(getMostRecentListId(state.lists));
    }
  }, [state.lists]);

  const selectedList = state.lists.find((l) => l.id === selectedListId) ?? state.lists[0];

  const generateDefaultListName = (): string => {
    const today = new Date().toISOString().split('T')[0];
    const existingNames = new Set(state.lists.map((l) => l.name));
    if (!existingNames.has(today)) return today;
    let counter = 1;
    while (existingNames.has(`${today} ${counter}`)) counter++;
    return `${today} ${counter}`;
  };

  const handleCreateNewList = () => {
    setListMenuVisible(false);
    setNewListName(generateDefaultListName());
    setNewListNo('');
    setNewListDescription('');
    setListNoError('');
    setNewListDialogVisible(true);
  };

  const handleCreateNewListConfirm = async () => {
    if (!newListName.trim()) return;
    const trimmedNo = newListNo.trim();
    if (!trimmedNo) {
      setListNoError(t.add.listNoRequired);
      return;
    }
    const duplicate = state.lists.some((l) => l.listNo === trimmedNo);
    if (duplicate) {
      setListNoError(t.add.listNoDuplicate);
      return;
    }
    const newList = await addList({ name: newListName.trim(), listNo: trimmedNo, description: newListDescription.trim() || undefined });
    setSelectedListId(newList.id);
    setNewListNo('');
    setNewListDescription('');
    setListNoError('');
    setNewListDialogVisible(false);
  };

  const handleLookup = async () => {
    if (!word.trim()) {
      setLookupError(t.add.wordFirst);
      return;
    }
    setIsLookingUp(true);
    setLookupError(null);
    setLookupResult(null);
    setSelectedDefinition('');
    try {
      const data = await lookupWord(word, activeDict?.sourceLang ?? 'en', activeDict?.targetLang ?? 'zh-CN');
      if (data) {
        setLookupResult(data);
        if (data.pronunciation) setPronunciation(data.pronunciation);
      } else {
        setLookupError(t.add.wordNotFound);
      }
    } catch {
      setLookupError(t.add.lookupFailed);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleUseDefinition = () => {
    if (selectedDefinition) {
      setMeaning(selectedDefinition);
      setLookupResult(null);
      setSelectedDefinition('');
    }
  };

  const handleSubmit = () => {
    if (!word.trim()) {
      setSnackbarMessage(t.add.wordRequired);
      setSnackbarVisible(true);
      return;
    }
    if (!meaning.trim()) {
      setSnackbarMessage(t.add.meaningRequired);
      setSnackbarVisible(true);
      return;
    }

    const wordsInList = state.words.filter((w) => w.listId === selectedListId).length;
    if (!canAddWord(wordsInList)) {
      setPaywallVisible(true);
      return;
    }

    addWord({
      word: word.trim(),
      meaning: meaning.trim(),
      pronunciation: pronunciation.trim(),
      source: source.trim(),
      dateAdded: getToday(),
      audioUri: null,
      listId: selectedListId,
    });

    setSnackbarMessage(t.add.wordAdded(word.trim(), selectedList?.name ?? ''));
    setSnackbarVisible(true);

    setWord('');
    setMeaning('');
    setPronunciation('');
    setSource('');
    setLookupResult(null);
    setSelectedDefinition('');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Surface
          style={[
            styles.header,
            { backgroundColor: theme.colors.primary, paddingTop: insets.top + 16 },
          ]}
          elevation={0}
        >
          <View style={styles.headerRow}>
            <View>
              <Text variant="headlineMedium" style={styles.title}>{t.add.title}</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>{t.add.subtitle}</Text>
            </View>
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

        <View style={styles.form}>
          {/* List Selector */}
          <Menu
            visible={listMenuVisible}
            onDismiss={() => setListMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={() => setListMenuVisible(true)}
                style={[
                  styles.listSelector,
                  {
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              >
                <View style={styles.listSelectorInner}>
                  <Icon name="folder" size={20} color={theme.colors.primary} />
                  <View style={styles.listSelectorText}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {t.add.saveToList}
                    </Text>
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{selectedList?.name ?? t.add.noList}</Text>
                  </View>
                  <Icon name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableRipple>
            }
          >
            {state.lists.map((list) => (
              <Menu.Item
                key={list.id}
                title={list.name}
                leadingIcon={list.id === selectedListId ? 'check' : 'folder'}
                onPress={() => {
                  setSelectedListId(list.id);
                  setListMenuVisible(false);
                }}
              />
            ))}
            <Divider />
            <Menu.Item
              leadingIcon="folder-plus"
              title={t.add.createNewList}
              onPress={handleCreateNewList}
            />
          </Menu>

          {/* Word Input */}
          <TextInput
            label={t.add.word}
            value={word}
            onChangeText={setWord}
            mode="outlined"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
            contentStyle={{ fontWeight: 'bold' }}
            left={<TextInput.Icon icon="alphabetical" />}
          />

          {/* Dictionary Lookup */}
          <View style={styles.lookupRow}>
            <Button
              mode="contained-tonal"
              onPress={handleLookup}
              loading={isLookingUp}
              disabled={isLookingUp || !word.trim()}
              icon="book-search"
              style={styles.lookupButton}
            >
              {t.add.lookUp}
            </Button>
            <Menu
              visible={dictMenuVisible}
              onDismiss={() => setDictMenuVisible(false)}
              anchor={
                <TouchableRipple
                  onPress={() => setDictMenuVisible(true)}
                  style={[styles.dictChip, { borderColor: theme.colors.outline }]}
                >
                  <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                    {activeDict
                      ? `${activeDict.sourceFlag}→${activeDict.targetFlag}`
                      : '—'}
                  </Text>
                </TouchableRipple>
              }
            >
              {state.settings.installedDictionaries.map((d) => (
                <Menu.Item
                  key={d.id}
                  title={`${d.sourceFlag} ${d.sourceName} → ${d.targetFlag} ${d.targetName}`}
                  leadingIcon={d.id === state.settings.activeDictionaryId ? 'check' : undefined}
                  onPress={() => {
                    updateSettings({ activeDictionaryId: d.id });
                    setDictMenuVisible(false);
                    setLookupResult(null);
                  }}
                />
              ))}
            </Menu>
          </View>

          {/* Lookup Error */}
          {lookupError && (
            <Card style={[styles.errorCard, { backgroundColor: theme.colors.errorContainer }]}>
              <Card.Content style={styles.errorContent}>
                <Icon name="alert-circle" size={20} color={theme.colors.error} />
                <Text style={{ color: theme.colors.onErrorContainer, marginLeft: 8 }}>
                  {lookupError}
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Lookup Result - Selectable Definitions */}
          {lookupResult && (
            <Card style={styles.resultCard} mode="outlined">
              <Card.Content>
                <View style={styles.resultHeader}>
                  <Text variant="titleMedium">{lookupResult.word}</Text>
                  {lookupResult.pronunciation ? (
                    <Chip compact style={{ marginLeft: 8 }}>
                      {lookupResult.pronunciation}
                    </Chip>
                  ) : null}
                </View>

                <Text
                  variant="labelMedium"
                  style={{ color: theme.colors.primary, marginTop: 12, marginBottom: 8 }}
                >
                  {t.add.selectDefinition}
                </Text>

                <RadioButton.Group
                  onValueChange={setSelectedDefinition}
                  value={selectedDefinition}
                >
                  {lookupResult.meanings.map((m, i) => (
                    <View key={i}>
                      <RadioButton.Item
                        label={m}
                        value={m}
                        style={styles.radioItem}
                        labelStyle={styles.radioLabel}
                        position="leading"
                      />
                      {i < lookupResult.meanings.length - 1 && <Divider />}
                    </View>
                  ))}
                </RadioButton.Group>

                <Button
                  mode="contained"
                  onPress={handleUseDefinition}
                  disabled={!selectedDefinition}
                  style={{ marginTop: 16 }}
                  icon="check"
                >
                  {t.add.useThisDefinition}
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Pronunciation Input */}
          <TextInput
            label={t.add.pronunciation}
            value={pronunciation}
            onChangeText={setPronunciation}
            mode="outlined"
            style={styles.input}
            contentStyle={{ fontWeight: 'bold' }}
            left={<TextInput.Icon icon="microphone" />}
          />

          {/* Meaning Input */}
          <TextInput
            label={t.add.meaning}
            value={meaning}
            onChangeText={setMeaning}
            mode="outlined"
            style={styles.input}
            contentStyle={{ fontWeight: 'bold' }}
            multiline
            numberOfLines={3}
            left={<TextInput.Icon icon="text" />}
          />

          {/* Source Input */}
          <TextInput
            label={t.add.source}
            value={source}
            onChangeText={setSource}
            mode="outlined"
            style={styles.input}
            contentStyle={{ fontWeight: 'bold' }}
            left={<TextInput.Icon icon="book-open-page-variant" />}
          />

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.submitButton}
            contentStyle={styles.submitContent}
            icon="plus"
          >
            {t.add.addWord}
          </Button>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: t.add.viewLists,
          onPress: () => navigation.navigate('ListTab' as never),
        }}
      >
        {snackbarMessage}
      </Snackbar>

      <Portal>
        <Dialog
          visible={newListDialogVisible}
          onDismiss={() => setNewListDialogVisible(false)}
        >
          <Dialog.Title>{t.add.newList}</Dialog.Title>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Dialog.Content>
            <TextInput
              label={t.add.listName}
              value={newListName}
              onChangeText={setNewListName}
              mode="outlined"
              autoFocus
            />
            <TextInput
              label={t.add.listNo}
              value={newListNo}
              onChangeText={(v) => { setNewListNo(v); setListNoError(''); }}
              mode="outlined"
              style={{ marginTop: 12 }}
              error={!!listNoError}
            />
            {listNoError ? (
              <Text variant="labelSmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {listNoError}
              </Text>
            ) : null}
            <TextInput
              label={t.add.description}
              value={newListDescription}
              onChangeText={setNewListDescription}
              mode="outlined"
              style={{ marginTop: 12 }}
            />
          </Dialog.Content>
          </TouchableWithoutFeedback>
          <Dialog.Actions>
            <Button onPress={() => { setNewListDialogVisible(false); setListNoError(''); }}>{t.common.cancel}</Button>
            <Button onPress={handleCreateNewListConfirm} disabled={!newListName.trim() || !newListNo.trim()}>
              {t.common.create}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Paywall */}
      {paywallVisible && (
        <View style={StyleSheet.absoluteFill}>
          <PaywallScreen onDismiss={() => setPaywallVisible(false)} />
        </View>
      )}
      <TabTooltip
        tabKey="add"
        icon="plus-circle"
        message="Type a word, tap Look Up, then save it to one of your lists."
      />
      <OnboardingCarousel
        visible={onboardingVisible}
        onDone={() => setOnboardingVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { color: '#1C1700', fontWeight: 'bold' },
  subtitle: { color: 'rgba(28, 23, 0, 0.6)', marginTop: 4 },
  form: { padding: 16 },
  listSelector: {
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  listSelectorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  listSelectorText: { flex: 1, marginLeft: 12 },
  input: { marginBottom: 12 },
  lookupRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  lookupButton: { flex: 1 },
  dictChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorCard: { marginBottom: 12 },
  errorContent: { flexDirection: 'row', alignItems: 'center' },
  resultCard: { marginBottom: 12 },
  resultHeader: { flexDirection: 'row', alignItems: 'center' },
  radioItem: { paddingVertical: 8 },
  radioLabel: { fontSize: 14, lineHeight: 20 },
  submitButton: { marginTop: 16 },
  submitContent: { paddingVertical: 8 },
});

export default AddWordScreen;
