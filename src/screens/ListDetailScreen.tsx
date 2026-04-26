import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Modal, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import {
  Surface,
  Text,
  TextInput,
  Card,
  IconButton,
  useTheme,
  Portal,
  Dialog,
  Button,
  ProgressBar,
  ActivityIndicator,
  Menu,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useWords } from '../context/WordContext';
import { Word } from '../types';
import { getToday, addDays } from '../utils/dateUtils';
import FeedbackButton from '../components/FeedbackButton';
import { useLanguage } from '../context/LanguageContext';

type ListDetailRouteProp = RouteProp<
  { ListDetail: { listId: string; listName: string; hiddenByDefault?: boolean } },
  'ListDetail'
>;

const ListDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ListDetailRouteProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, deleteWord, updateWord, addCalendarEntries } = useWords();
  const { t } = useLanguage();

  const { listId, listName, hiddenByDefault } = route.params;

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<Word | null>(null);

  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editWord, setEditWord] = useState('');
  const [editMeaning, setEditMeaning] = useState('');
  const [editPronunciation, setEditPronunciation] = useState('');
  const [editSource, setEditSource] = useState('');
  const [wordToEdit, setWordToEdit] = useState<Word | null>(null);

  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [cardsHidden, setCardsHidden] = useState(hiddenByDefault ?? false);
  const [calendarSnackbar, setCalendarSnackbar] = useState('');

  const currentList = state.lists.find((l) => l.id === listId);

  const handleAddToCalendar = () => {
    if (!currentList?.listNo) {
      setCalendarSnackbar(t.listDetail.listNoMissing);
      return;
    }
    const intervals = state.settings.reviewIntervals;
    const today = getToday();
    const dates: string[] = [];
    const offsets: string[] = [];
    for (const day of intervals) {
      dates.push(addDays(today, day));
      offsets.push(`+${day}`);
    }
    addCalendarEntries(currentList.listNo, dates);
    setCalendarSnackbar(t.listDetail.addedToCalendar(currentList.listNo, offsets.join(', ')));
  };

  // Long audio playback state
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const stoppedRef = useRef(false);

  const listWords = state.words.filter((w) => w.listId === listId);
  const wordsWithAudio = listWords.filter((w) => w.audioUri);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      soundRef.current?.unloadAsync();
    };
  }, []);

  const stopAll = async () => {
    stoppedRef.current = true;
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setIsPlayingAll(false);
    setIsPaused(false);
    setIsLoading(false);
    setCurrentPlayIndex(0);
  };

  const pauseAll = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync().catch(() => {});
      setIsPaused(true);
    }
  };

  const resumeAll = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync().catch(() => {});
      setIsPaused(false);
    }
  };

  const jumpToIndex = async (index: number) => {
    if (index < 0 || index >= wordsWithAudio.length) return;
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setIsPaused(false);
    stoppedRef.current = false;
    playFromIndex(index);
  };

  const playFromIndex = async (index: number) => {
    if (stoppedRef.current || index >= wordsWithAudio.length) {
      setIsPlayingAll(false);
      setIsLoading(false);
      setCurrentPlayIndex(0);
      return;
    }

    const word = wordsWithAudio[index];
    setCurrentPlayIndex(index);
    setIsPaused(false);
    setIsLoading(true);

    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: word.audioUri! },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      setIsLoading(false);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          playFromIndex(index + 1);
        }
      });
    } catch {
      // Skip this word and try next
      playFromIndex(index + 1);
    }
  };

  const handlePlayAll = async () => {
    if (wordsWithAudio.length === 0) return;
    stoppedRef.current = false;
    setIsPlayingAll(true);
    setCurrentPlayIndex(0);
    await playFromIndex(0);
  };


  const handleDeletePress = (word: Word) => {
    setWordToDelete(word);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (wordToDelete) deleteWord(wordToDelete.id, wordToDelete.audioUri);
    setDeleteDialogVisible(false);
    setWordToDelete(null);
  };

  const handleEditPress = (word: Word) => {
    setWordToEdit(word);
    setEditWord(word.word);
    setEditMeaning(word.meaning);
    setEditPronunciation(word.pronunciation);
    setEditSource(word.source);
    setEditDialogVisible(true);
  };

  const confirmEdit = () => {
    if (!wordToEdit || !editWord.trim() || !editMeaning.trim()) return;
    updateWord({
      ...wordToEdit,
      word: editWord.trim(),
      meaning: editMeaning.trim(),
      pronunciation: editPronunciation.trim(),
      source: editSource.trim(),
    });
    setEditDialogVisible(false);
    setWordToEdit(null);
  };

  const renderItem = ({ item, index }: { item: Word; index: number }) => {
    const isCurrentlyPlaying =
      isPlayingAll && wordsWithAudio[currentPlayIndex]?.id === item.id;

    return (
      <View style={{ marginBottom: 8 }}>
      <Card
        style={[
          styles.wordCard,
          !item.audioUri && { borderColor: theme.colors.error, borderWidth: 1.5 },
          isCurrentlyPlaying && { borderColor: theme.colors.primary, borderWidth: 2 },
        ]}
        mode="elevated"
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            {/* Index number */}
            <Text variant="titleMedium" style={[styles.indexNumber, { color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }]}>
              {index + 1}
            </Text>
            {/* Left: word + pronunciation */}
            <View style={styles.cardWordCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {isCurrentlyPlaying && (
                  <Icon
                    name="volume-high"
                    size={16}
                    color={theme.colors.primary}
                    style={{ marginRight: 6 }}
                  />
                )}
                {cardsHidden
                  ? <View style={[styles.redactedBar, { width: 80, height: 16 }]} />
                  : <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.word}</Text>
                }
              </View>
              {item.pronunciation ? (
                cardsHidden
                  ? <View style={[styles.redactedBar, { width: 50, height: 10, marginTop: 4 }]} />
                  : <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {item.pronunciation}
                    </Text>
              ) : null}
            </View>
            {/* Middle: definition */}
            <View style={styles.cardMeaningCol}>
              {cardsHidden ? (
                <>
                  <View style={[styles.redactedBar, { width: '90%', height: 12, marginBottom: 6 }]} />
                  <View style={[styles.redactedBar, { width: '60%', height: 12 }]} />
                </>
              ) : (
                <Text
                  variant="bodyMedium"
                  numberOfLines={2}
                  style={{ color: theme.colors.onSurfaceVariant, fontWeight: 'bold' }}
                >
                  {item.meaning}
                </Text>
              )}
            </View>
            {/* Record shortcut — always rendered to keep layout stable */}
            <IconButton
              icon="microphone-plus"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => navigation.navigate('RecordScreen', { wordId: item.id })}
              style={{ opacity: item.audioUri ? 0 : 1 }}
              disabled={!!item.audioUri}
            />
            {/* Right: menu */}
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
              <Menu.Item
                leadingIcon="pencil"
                title={t.common.edit}
                onPress={() => { setMenuVisible(null); handleEditPress(item); }}
              />
              <Menu.Item
                leadingIcon={item.audioUri ? 'microphone' : 'microphone-plus'}
                title={item.audioUri ? t.listDetail.reRecord : t.listDetail.record}
                onPress={() => { setMenuVisible(null); navigation.navigate('RecordScreen', { wordId: item.id }); }}
              />
              <Divider />
              <Menu.Item
                leadingIcon="delete"
                title={t.common.delete}
                titleStyle={{ color: theme.colors.error }}
                onPress={() => { setMenuVisible(null); handleDeletePress(item); }}
              />
            </Menu>
          </View>

          {item.source ? (
            <Text variant="labelSmall" style={styles.cardSource}>
              {item.source}
            </Text>
          ) : null}
        </Card.Content>
      </Card>
      </View>
    );
  };

  const renderListHeader = () => (
    <>
      {/* Long Audio Player Card */}
      <Card
        style={[
          styles.playerCard,
          isPlayingAll && { borderColor: theme.colors.primary, borderWidth: 1.5 },
        ]}
        mode="elevated"
      >
        <Card.Content>
          <View style={styles.playerTop}>
            <Icon name="playlist-play" size={28} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text variant="titleMedium">{t.listDetail.playAll}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {t.listDetail.audioCount(wordsWithAudio.length, listWords.length)}
              </Text>
            </View>
            <IconButton
              icon="calendar-plus"
              size={28}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={handleAddToCalendar}
            />
            <IconButton
              icon={cardsHidden ? 'eye' : 'eye-off'}
              size={28}
              iconColor={theme.colors.onSurfaceVariant}
              onPress={() => setCardsHidden(prev => !prev)}
            />
            {isPlayingAll ? (
              <IconButton
                icon="stop-circle"
                size={36}
                iconColor={theme.colors.error}
                onPress={stopAll}
              />
            ) : (
              <IconButton
                icon="play-circle"
                size={36}
                iconColor={
                  wordsWithAudio.length === 0
                    ? theme.colors.outline
                    : theme.colors.primary
                }
                onPress={handlePlayAll}
                disabled={wordsWithAudio.length === 0}
              />
            )}
          </View>

          {isPlayingAll && (
            <View style={styles.playerProgress}>
              <ProgressBar
                progress={(currentPlayIndex + 1) / wordsWithAudio.length}
                color={theme.colors.primary}
                style={styles.progressBar}
              />
              <View style={styles.playerStatus}>
                {isLoading ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Icon name="volume-high" size={16} color={theme.colors.primary} />
                )}
                <Text
                  variant="labelMedium"
                  style={{ marginLeft: 6, flex: 1, color: theme.colors.onSurfaceVariant }}
                >
                  {isLoading ? t.listDetail.loading : t.listDetail.playing(wordsWithAudio[currentPlayIndex]?.word ?? '')}
                  {'  '}
                  <Text style={{ color: theme.colors.outline }}>
                    {currentPlayIndex + 1}/{wordsWithAudio.length}
                  </Text>
                </Text>
                <IconButton
                  icon="skip-previous"
                  size={22}
                  iconColor={currentPlayIndex === 0 ? theme.colors.outline : theme.colors.primary}
                  disabled={currentPlayIndex === 0 || isLoading}
                  onPress={() => jumpToIndex(currentPlayIndex - 1)}
                  style={styles.playerControlBtn}
                />
                <IconButton
                  icon={isPaused ? 'play' : 'pause'}
                  size={22}
                  iconColor={theme.colors.primary}
                  disabled={isLoading}
                  onPress={isPaused ? resumeAll : pauseAll}
                  style={styles.playerControlBtn}
                />
                <IconButton
                  icon="skip-next"
                  size={22}
                  iconColor={currentPlayIndex === wordsWithAudio.length - 1 ? theme.colors.outline : theme.colors.primary}
                  disabled={currentPlayIndex === wordsWithAudio.length - 1 || isLoading}
                  onPress={() => jumpToIndex(currentPlayIndex + 1)}
                  style={styles.playerControlBtn}
                />
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="book-plus" size={64} color={theme.colors.outline} />
      <Text variant="titleMedium" style={{ marginTop: 16 }}>
        {t.listDetail.noWords}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
        {t.listDetail.addFromAdd}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface
        style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}
        elevation={0}
      >
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" iconColor="#1C1700" onPress={() => navigation.goBack()} />
          <View style={styles.headerText}>
            <Text variant="titleLarge" style={styles.title} numberOfLines={1}>
              {listName}
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {t.common.words(listWords.length)}
            </Text>
          </View>
          <FeedbackButton />
        </View>
      </Surface>

      <FlatList
        data={listWords}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={listWords.length === 0 ? styles.emptyList : styles.list}
      />

      {/* Edit Modal — native Modal avoids Portal/IME conflict on iOS */}
      <Modal
        visible={editDialogVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditDialogVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.editModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setEditDialogVisible(false)}
            activeOpacity={1}
          />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.editModalSheet, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleLarge" style={styles.editModalTitle}>{t.listDetail.editWord}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <TextInput
                label={t.listDetail.word}
                value={editWord}
                onChangeText={setEditWord}
                mode="outlined"
                autoCapitalize="none"
                style={styles.editInput}
                contentStyle={{ fontWeight: 'bold' }}
              />
              <TextInput
                label={t.add.meaning}
                value={editMeaning}
                onChangeText={setEditMeaning}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.editInput}
                contentStyle={{ fontWeight: 'bold' }}
              />
              <TextInput
                label={t.listDetail.pronunciation}
                value={editPronunciation}
                onChangeText={setEditPronunciation}
                mode="outlined"
                style={styles.editInput}
                contentStyle={{ fontWeight: 'bold' }}
              />
              <TextInput
                label={t.listDetail.source}
                value={editSource}
                onChangeText={setEditSource}
                mode="outlined"
                style={styles.editInput}
                contentStyle={{ fontWeight: 'bold' }}
              />
            </ScrollView>
            <View style={styles.editModalActions}>
              <Button textColor="#000" onPress={() => setEditDialogVisible(false)}>{t.common.cancel}</Button>
              <Button
                textColor="#000"
                onPress={confirmEdit}
                disabled={!editWord.trim() || !editMeaning.trim()}
              >
                {t.common.save}
              </Button>
            </View>
          </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Portal>
        {/* Delete Confirmation Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title style={{ textAlign: 'center' }}>{t.listDetail.deleteWordTitle}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              {t.listDetail.deleteWordConfirm(wordToDelete?.word ?? '')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>{t.common.cancel}</Button>
            <Button onPress={confirmDelete} textColor={theme.colors.error}>
              {t.common.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!calendarSnackbar}
        onDismiss={() => setCalendarSnackbar('')}
        duration={3000}
      >
        {calendarSnackbar}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1, paddingRight: 16 },
  title: { color: '#1C1700', fontWeight: 'bold' },
  subtitle: { color: 'rgba(255,255,255,0.8)' },
  list: { padding: 16, paddingBottom: 100 },
  emptyList: { flex: 1, padding: 16 },
  playerCard: { marginBottom: 16 },
  playerTop: { flexDirection: 'row', alignItems: 'center' },
  playerProgress: { marginTop: 12 },
  progressBar: { height: 6, borderRadius: 3 },
  playerStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  playerControlBtn: { margin: 0, width: 32, height: 32 },
  wordCard: {},
  indexNumber: { width: 24, textAlign: 'center', marginRight: 4 },
  redactedBar: {
    backgroundColor: '#D0D0D0',
    borderRadius: 4,
  },
  cardSource: { color: '#79747E', marginTop: 6, textAlign: 'right' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardWordCol: { flex: 1.05 },
  cardMeaningCol: { flex: 0.95 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  editInput: { marginBottom: 12 },
  editModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  editModalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  editModalTitle: { fontWeight: 'bold', marginBottom: 20 },
  editModalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
});

export default ListDetailScreen;
