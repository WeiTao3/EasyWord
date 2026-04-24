import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, Keyboard, TouchableWithoutFeedback, Modal, RefreshControl } from 'react-native';
import {
  Surface,
  Text,
  Card,
  FAB,
  useTheme,
  Portal,
  Dialog,
  Button,
  TextInput,
  IconButton,
  Menu,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useWords } from '../context/WordContext';
import { useSubscription } from '../context/SubscriptionContext';
import { WordList } from '../types';
import PaywallScreen from './PaywallScreen';
import FeedbackButton from '../components/FeedbackButton';
import TabTooltip from '../components/TabTooltip';
import OnboardingCarousel from '../components/OnboardingCarousel';
import { useLanguage } from '../context/LanguageContext';

const WordListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, addList, updateList, deleteList, refreshListsData } = useWords();
  const { canAddList, isPremium, listLimit } = useSubscription();
  const { t } = useLanguage();
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshListsData();
    setRefreshing(false);
  }, [refreshListsData]);

  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<WordList | null>(null);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newListNo, setNewListNo] = useState('');
  const [listNoError, setListNoError] = useState('');

  const wordCountFor = (listId: string) =>
    state.words.filter((w) => w.listId === listId).length;

  const generateDefaultName = (): string => {
    const today = new Date().toISOString().split('T')[0];
    const existingNames = new Set(state.lists.map((l) => l.name));
    if (!existingNames.has(today)) return today;
    let counter = 1;
    while (existingNames.has(`${today} ${counter}`)) counter++;
    return `${today} ${counter}`;
  };

  const handleCreate = async () => {
    if (!canAddList(state.lists.length)) {
      setCreateDialogVisible(false);
      setPaywallVisible(true);
      return;
    }
    if (!newName.trim()) return;
    const trimmedNo = newListNo.trim();
    if (!trimmedNo) {
      setListNoError(t.lists.listNoRequired);
      return;
    }
    const duplicate = state.lists.some((l) => l.listNo === trimmedNo);
    if (duplicate) {
      setListNoError(t.lists.listNoDuplicate);
      return;
    }
    await addList({ name: newName.trim(), description: newDescription.trim(), listNo: trimmedNo });
    setNewName('');
    setNewDescription('');
    setNewListNo('');
    setListNoError('');
    setCreateDialogVisible(false);
  };

  const handleEditOpen = (list: WordList) => {
    setSelectedList(list);
    setNewName(list.name);
    setNewDescription(list.description ?? '');
    setNewListNo(list.listNo ?? '');
    setListNoError('');
    setMenuVisible(null);
    setEditDialogVisible(true);
  };

  const handleEditSave = () => {
    if (!selectedList || !newName.trim()) return;
    const trimmedNo = newListNo.trim();
    if (trimmedNo) {
      const duplicate = state.lists.some((l) => l.listNo === trimmedNo && l.id !== selectedList.id);
      if (duplicate) {
        setListNoError(t.lists.listNoDuplicate);
        return;
      }
    }
    updateList({ ...selectedList, name: newName.trim(), description: newDescription.trim(), listNo: trimmedNo || undefined });
    setListNoError('');
    setEditDialogVisible(false);
    setSelectedList(null);
  };

  const handleDeleteOpen = (list: WordList) => {
    setSelectedList(list);
    setMenuVisible(null);
    setDeleteDialogVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedList) deleteList(selectedList.id);
    setDeleteDialogVisible(false);
    setSelectedList(null);
  };

  const renderItem = ({ item }: { item: WordList }) => {
    const count = wordCountFor(item.id);
    return (
      <Card
        style={styles.listCard}
        mode="elevated"
        onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.iconWrapper}>
            <Icon name="folder" size={32} color={theme.colors.primary} />
          </View>
          <View style={styles.cardText}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="titleMedium" numberOfLines={1}>{item.name}</Text>
              {item.listNo ? (
                <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  #{item.listNo}
                </Text>
              ) : null}
            </View>
            {item.description ? (
              <Text
                variant="bodySmall"
                numberOfLines={1}
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {item.description}
              </Text>
            ) : null}
            <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
              {t.common.words(count)}
            </Text>
          </View>
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item leadingIcon="pencil" onPress={() => handleEditOpen(item)} title={t.common.edit} />
            <Menu.Item
              leadingIcon="delete"
              onPress={() => handleDeleteOpen(item)}
              title={t.common.delete}
              titleStyle={{ color: theme.colors.error }}
            />
          </Menu>
        </Card.Content>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="folder-open" size={64} color={theme.colors.outline} />
      <Text variant="titleMedium" style={{ marginTop: 16 }}>
        {t.lists.noLists}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
        {t.lists.createFirst}
      </Text>
    </View>
  );

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
          <View>
            <Text variant="headlineMedium" style={styles.title}>
              {t.lists.title}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {t.lists.subtitle(state.lists.length, state.words.length)}
            </Text>
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

      <FlatList
        data={[...state.lists].sort(
          (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
        )}
        keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          state.lists.length === 0 ? styles.emptyList : styles.list
        }
      />

      {/* FAB to create list */}
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => {
          setNewName(generateDefaultName());
          setNewDescription('');
          setCreateDialogVisible(true);
        }}
      />

      {/* Create Dialog */}
      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>{t.lists.newList}</Dialog.Title>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Dialog.Content>
            <TextInput
              label={t.add.listName}
              value={newName}
              onChangeText={setNewName}
              mode="outlined"
              autoFocus
            />
            <TextInput
              label={t.add.listNo}
              value={newListNo}
              onChangeText={(v) => { setNewListNo(v); setListNoError(''); }}
              mode="outlined"
              style={{ marginTop: 12 }}
              keyboardType="default"
              error={!!listNoError}
            />
            {listNoError ? (
              <Text variant="labelSmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {listNoError}
              </Text>
            ) : null}
            <TextInput
              label={t.add.description}
              value={newDescription}
              onChangeText={setNewDescription}
              mode="outlined"
              style={{ marginTop: 12 }}
            />
          </Dialog.Content>
          </TouchableWithoutFeedback>
          <Dialog.Actions>
            <Button onPress={() => { setCreateDialogVisible(false); setListNoError(''); }}>{t.common.cancel}</Button>
            <Button onPress={handleCreate} disabled={!newName.trim() || !newListNo.trim()}>
              {t.common.create}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>{t.lists.editList}</Dialog.Title>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Dialog.Content>
            <TextInput
              label={t.add.listName}
              value={newName}
              onChangeText={setNewName}
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
              value={newDescription}
              onChangeText={setNewDescription}
              mode="outlined"
              style={{ marginTop: 12 }}
            />
          </Dialog.Content>
          </TouchableWithoutFeedback>
          <Dialog.Actions>
            <Button onPress={() => { setEditDialogVisible(false); setListNoError(''); }}>{t.common.cancel}</Button>
            <Button onPress={handleEditSave} disabled={!newName.trim()}>
              {t.common.save}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title style={{ textAlign: 'center' }}>{t.lists.deleteList}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              {t.lists.deleteConfirm(selectedList?.name ?? '')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>{t.common.cancel}</Button>
            <Button onPress={handleDeleteConfirm} textColor={theme.colors.error}>
              {t.common.delete}
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
        tabKey="lists"
        icon="folder-multiple"
        message="Tap + to create a list. Give it a unique List No — the calendar uses it to schedule reviews."
      />
      <OnboardingCarousel
        visible={onboardingVisible}
        onDone={() => setOnboardingVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { color: '#1C1700', fontWeight: 'bold' },
  subtitle: { color: 'rgba(28, 23, 0, 0.6)', marginTop: 4 },
  list: { padding: 16, paddingBottom: 120 },
  emptyList: { flex: 1 },
  listCard: { marginBottom: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { marginRight: 12 },
  cardText: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 96,
  },
});

export default WordListScreen;
