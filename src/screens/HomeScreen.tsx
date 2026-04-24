import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform, ScrollView, Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  Surface, Text, Card, IconButton, useTheme, Button,
  TextInput, ActivityIndicator, Snackbar,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useWords } from '../context/WordContext';
import { lookupWord } from '../services/dictionaryApi';
import { getToday } from '../utils/dateUtils';
import FeedbackButton from '../components/FeedbackButton';
import TabTooltip from '../components/TabTooltip';
import OnboardingCarousel from '../components/OnboardingCarousel';
import IELTS_RESOURCES, { IELTSResource, Channel, CHANNEL_LABELS } from '../data/ieltResources';
import { getTranscript, TranscriptSegment } from '../utils/transcriptUtils';
import { useLanguage } from '../context/LanguageContext';

const pickRandom = (resources: IELTSResource[]): IELTSResource =>
  resources[Math.floor(Math.random() * resources.length)];

const getMostRecentListId = (lists: { id: string; dateCreated: string }[]): string => {
  if (lists.length === 0) return 'default';
  return [...lists].sort(
    (a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  )[0].id;
};

const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, addWord } = useWords();
  const { t } = useLanguage();

  // ── Channel filter ───────────────────────────────────────────────────────
  const [channel, setChannel] = useState<Channel>('celpip');
  const channelResources = IELTS_RESOURCES.filter((r) => r.channel === channel);

  // ── Player ──────────────────────────────────────────────────────────────
  const [resource, setResource] = useState<IELTSResource>(() => pickRandom(IELTS_RESOURCES.filter(r => r.channel === 'celpip')));
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<any>(null);

  // ── Transcript ───────────────────────────────────────────────────────────
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptVisible, setTranscriptVisible] = useState(true);
  const [currentSegIdx, setCurrentSegIdx] = useState(-1);
  const flatListRef = useRef<FlatList>(null);
  const channelButtonRef = useRef<View>(null);
  const [channelMenuLayout, setChannelMenuLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // ── Add-word modal ───────────────────────────────────────────────────────
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [meaning, setMeaning] = useState('');
  const [source, setSource] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMeanings, setLookupMeanings] = useState<string[]>([]);
  const [selectedListId, setSelectedListId] = useState(() => getMostRecentListId(state.lists));
  const [listMenuVisible, setListMenuVisible] = useState(false);
  const [channelMenuVisible, setChannelMenuVisible] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  // ── Load transcript when resource changes (bundled → cache → YouTube API) ──
  useEffect(() => {
    let cancelled = false;
    setTranscript([]);
    setCurrentSegIdx(-1);
    setTranscriptError(null);

    // VOA News Words videos have no captions — skip fetching entirely
    if (resource.channel === 'voa') {
      setTranscriptError(t.home.noTranscript);
      setTranscriptLoading(false);
      return () => {};
    }

    setTranscriptLoading(true);

    getTranscript(resource.youtubeId)
      .then((segments) => {
        if (!cancelled) {
          setTranscript(segments);
          setTranscriptLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTranscriptError(t.home.noTranscript);
          setTranscriptLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [resource, t]);

  // ── Poll current time to highlight segment ───────────────────────────────
  useEffect(() => {
    if (!playing || transcript.length === 0) return;
    const interval = setInterval(async () => {
      if (!playerRef.current) return;
      const t: number = await playerRef.current.getCurrentTime();
      const currentMs = t * 1000;
      let idx = -1;
      for (let i = 0; i < transcript.length; i++) {
        const next = transcript[i + 1]?.offset ?? Infinity;
        if (currentMs >= transcript[i].offset && currentMs < next) {
          idx = i;
          break;
        }
      }
      if (idx !== -1 && idx !== currentSegIdx) {
        setCurrentSegIdx(idx);
        flatListRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.3 });
      }
    }, 500);
    return () => clearInterval(interval);
  }, [playing, transcript, currentSegIdx]);

  const onStateChange = useCallback((s: string) => {
    if (s === 'ended') { setPlaying(false); setCurrentSegIdx(-1); }
    else if (s === 'playing') setPlaying(true);
    else if (s === 'paused') setPlaying(false);
  }, []);

  const handleShuffle = () => {
    setCurrentSegIdx(-1);
    if (channelResources.length === 0) return;
    let next = pickRandom(channelResources);
    if (channelResources.length > 1) {
      while (next.id === resource.id) next = pickRandom(channelResources);
    }
    setResource(next);
  };

  const handleChannelChange = (ch: Channel) => {
    setChannel(ch);
    const resources = IELTS_RESOURCES.filter((r) => r.channel === ch);
    if (resources.length > 0) {
      setPlaying(false);
      setCurrentSegIdx(-1);
      setResource(pickRandom(resources));
    }
  };

  const seekBy = async (secs: number) => {
    if (!playerRef.current) return;
    const t: number = await playerRef.current.getCurrentTime();
    playerRef.current.seekTo(Math.max(0, t + secs), true);
  };

  // ── Word tap ─────────────────────────────────────────────────────────────
  const handleWordTap = (raw: string) => {
    const cleaned = raw.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
    if (!cleaned) return;
    setSelectedWord(cleaned);
    setPronunciation('');
    setMeaning('');
    setSource(resource.title);
    setLookupMeanings([]);
    setSelectedListId(getMostRecentListId(state.lists));
    setAddModalVisible(true);
  };

  const handleLookup = async () => {
    setIsLookingUp(true);
    try {
      const activeDict = state.settings.installedDictionaries.find(
        (d) => d.id === state.settings.activeDictionaryId
      ) ?? state.settings.installedDictionaries[0];
      const result = await lookupWord(
        selectedWord,
        activeDict?.sourceLang ?? 'en',
        activeDict?.targetLang ?? 'zh-CN'
      );
      if (result) {
        setLookupMeanings(result.meanings);
        if (result.meanings.length > 0) setMeaning(result.meanings[0]);
      } else {
        setLookupMeanings([]);
      }
    } catch {
      setLookupMeanings([]);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleAddWord = () => {
    if (!selectedWord.trim() || !meaning.trim()) return;
    const list = state.lists.find((l) => l.id === selectedListId);
    addWord({
      word: selectedWord.trim(),
      meaning: meaning.trim(),
      pronunciation: pronunciation.trim(),
      source: source.trim(),
      dateAdded: getToday(),
      audioUri: null,
      listId: selectedListId,
    });
    setAddModalVisible(false);
    setSnackbar(t.home.wordAdded(selectedWord.trim(), list?.name ?? ''));
  };

  const selectedList = state.lists.find((l) => l.id === selectedListId) ?? state.lists[0];

  // ── Render transcript segment ─────────────────────────────────────────────
  const renderSegment = useCallback(({ item, index }: { item: TranscriptSegment; index: number }) => {
    const isCurrent = index === currentSegIdx;
    const words = item.text.split(' ');
    return (
      <View
        style={[
          styles.segment,
          isCurrent && { backgroundColor: theme.colors.primaryContainer, borderRadius: 6 },
        ]}
      >
        <View style={styles.segmentWords}>
          {words.map((word, wi) => (
            <TouchableOpacity key={wi} onPress={() => handleWordTap(word)} activeOpacity={0.6}>
              <Text
                style={[
                  styles.segmentWord,
                  { color: isCurrent ? theme.colors.primary : theme.colors.onSurface },
                  isCurrent && { fontWeight: 'bold' },
                ]}
              >
                {word}{wi < words.length - 1 ? ' ' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }, [currentSegIdx, theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface
        style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 16 }]}
        elevation={0}
      >
        <View style={styles.headerRow}>
          <Text variant="headlineMedium" style={styles.headerTitle}>{t.home.title}</Text>
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
        {/* Channel selector dropdown button */}
        <View style={styles.channelDropdownWrapper} ref={channelButtonRef}>
          <TouchableOpacity
            style={[styles.channelDropdown, { borderColor: 'rgba(28,23,0,0.3)', backgroundColor: 'rgba(28,23,0,0.08)' }]}
            onPress={() => {
              channelButtonRef.current?.measureInWindow((x: number, y: number, width: number, height: number) => {
                setChannelMenuLayout({ x, y, width, height });
                setChannelMenuVisible(v => !v);
              });
            }}
          >
            <Text style={[styles.channelDropdownText, { color: '#1C1700' }]}>
              {CHANNEL_LABELS[channel]}
            </Text>
            <Icon name={channelMenuVisible ? 'chevron-up' : 'chevron-down'} size={20} color="rgba(28,23,0,0.6)" />
          </TouchableOpacity>
        </View>
      </Surface>

      {/* Channel dropdown menu — renders outside Surface so it floats over the video */}
      {channelMenuVisible && (
        <>
          <TouchableWithoutFeedback onPress={() => setChannelMenuVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={[
            styles.channelDropdownMenu,
            {
              top: channelMenuLayout.y + channelMenuLayout.height,
              left: channelMenuLayout.x,
              width: channelMenuLayout.width,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}>
            {(['celpip', 'bbc', 'voa'] as Channel[]).map((ch) => (
              <TouchableOpacity
                key={ch}
                style={[styles.channelDropdownMenuItem, ch === channel && { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => { handleChannelChange(ch); setChannelMenuVisible(false); }}
              >
                <Text style={{ fontSize: 14, color: theme.colors.onSurface }}>{CHANNEL_LABELS[ch]}</Text>
                {ch === channel && <Icon name="check" size={16} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {channelResources.length === 0 ? (
        <View style={styles.emptyChannel}>
          <Icon name="video-off-outline" size={56} color={theme.colors.outline} />
          <Text variant="titleMedium" style={{ marginTop: 16 }}>{t.home.noVideos}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, textAlign: 'center' }}>
            {t.home.noVideosDesc}
          </Text>
        </View>
      ) : (
        <>
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text variant="titleSmall" style={[styles.resourceTitle, { color: theme.colors.onSurface }]} numberOfLines={2}>
          {resource.title}
        </Text>
        <IconButton icon="shuffle-variant" size={22} iconColor={theme.colors.primary} onPress={handleShuffle} />
      </View>

      {/* YouTube player */}
      <Card style={styles.playerCard} mode="elevated">
        <YoutubePlayer
          ref={playerRef}
          height={200}
          videoId={resource.youtubeId}
          play={playing}
          onChangeState={onStateChange}
        />
        <View style={styles.controls}>
          <IconButton icon="rewind-10" size={32} iconColor={theme.colors.primary} onPress={() => seekBy(-10)} />
          <IconButton icon="fast-forward-10" size={32} iconColor={theme.colors.primary} onPress={() => seekBy(10)} />
        </View>
      </Card>

      {/* Transcript header */}
      <View style={styles.transcriptHeader}>
        <Text variant="titleSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
          {t.home.transcript}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, flex: 1, marginLeft: 8 }}>
          {t.home.tapToAdd}
        </Text>
        <Button
          mode="text"
          compact
          onPress={() => setTranscriptVisible(v => !v)}
          icon={transcriptVisible ? 'eye-off' : 'eye'}
        >
          {transcriptVisible ? t.home.hide : t.home.show}
        </Button>
      </View>

      {/* Transcript body */}
      {transcriptVisible && (
        <View style={styles.transcriptBody}>
          {transcriptLoading ? (
            <View style={styles.transcriptCenter}>
              <ActivityIndicator size="small" />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                {t.home.loadingTranscript}
              </Text>
            </View>
          ) : transcriptError ? (
            <View style={styles.transcriptCenter}>
              <Icon name="alert-circle-outline" size={32} color={theme.colors.error} />
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8, textAlign: 'center' }}>
                {transcriptError}
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={transcript}
              keyExtractor={(_, i) => String(i)}
              renderItem={renderSegment}
              contentContainerStyle={styles.transcriptList}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 0.3 });
                }, 300);
              }}
            />
          )}
        </View>
      )}
        </>
      )}

      {/* Add Word Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setAddModalVisible(false)} activeOpacity={1} />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleLarge" style={styles.modalTitle}>{t.home.addWord}</Text>

              {/* Word input */}
              <TextInput
                label={t.home.word}
                value={selectedWord}
                onChangeText={setSelectedWord}
                mode="outlined"
                style={{ marginBottom: 12 }}
                contentStyle={{ fontWeight: 'bold' }}
              />

              {/* Pronunciation input */}
              <TextInput
                label={t.home.pronunciation}
                value={pronunciation}
                onChangeText={setPronunciation}
                mode="outlined"
                style={{ marginBottom: 12 }}
                contentStyle={{ fontWeight: 'bold' }}
              />

              {/* Dictionary lookup */}
              <Button
                mode="contained-tonal"
                icon="book-search"
                loading={isLookingUp}
                onPress={handleLookup}
                style={{ marginBottom: 12 }}
              >
                {t.home.lookUpInDictionary}
              </Button>

              {/* Lookup suggestions */}
              {lookupMeanings.length > 0 && (
                <ScrollView style={styles.suggestionsScroll} nestedScrollEnabled>
                  {lookupMeanings.map((m, i) => (
                    <TouchableOpacity key={i} onPress={() => setMeaning(m)} style={[
                      styles.suggestionItem,
                      { backgroundColor: meaning === m ? theme.colors.primaryContainer : theme.colors.surfaceVariant },
                    ]}>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Meaning input */}
              <TextInput
                label={t.home.meaning}
                value={meaning}
                onChangeText={setMeaning}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={{ marginBottom: 12 }}
                contentStyle={{ fontWeight: 'bold' }}
              />

              {/* Source input */}
              <TextInput
                label={t.add.source}
                value={source}
                onChangeText={setSource}
                mode="outlined"
                style={{ marginBottom: 12 }}
                contentStyle={{ fontWeight: 'bold' }}
              />

              {/* List selector */}
              <View style={styles.listSelectorWrapper}>
                <TouchableOpacity
                  style={[styles.listSelector, { borderColor: listMenuVisible ? theme.colors.primary : theme.colors.outline }]}
                  onPress={() => setListMenuVisible(v => !v)}
                >
                  <Icon name="folder" size={18} color={theme.colors.primary} />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{t.home.saveToList}</Text>
                    <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>{selectedList?.name ?? '—'}</Text>
                  </View>
                  <Icon name={listMenuVisible ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
                {listMenuVisible && (
                  <View style={[styles.listDropdown, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
                    {state.lists.map((list) => (
                      <TouchableOpacity
                        key={list.id}
                        style={[
                          styles.listDropdownItem,
                          list.id === selectedListId && { backgroundColor: theme.colors.primaryContainer },
                        ]}
                        onPress={() => { setSelectedListId(list.id); setListMenuVisible(false); }}
                      >
                        <Icon
                          name={list.id === selectedListId ? 'check' : 'folder'}
                          size={16}
                          color={list.id === selectedListId ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                        <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.onSurface }}>{list.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <Button textColor={theme.colors.onSurface} onPress={() => setAddModalVisible(false)}>{t.common.cancel}</Button>
                <Button
                  mode="contained"
                  onPress={handleAddWord}
                  disabled={!meaning.trim()}
                  icon="plus"
                >
                  {t.home.addWord}
                </Button>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2500}>
        {snackbar}
      </Snackbar>
      <TabTooltip
        tabKey="home"
        icon="book-play"
        message="Watch CELPIP listening practice videos to discover new vocabulary."
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
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  channelDropdownWrapper: {
    marginTop: 12,
  },
  channelDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  channelDropdownMenu: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 999,
    elevation: 8,
  },
  channelDropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  channelDropdownText: { fontSize: 14, fontWeight: '500' },
  emptyChannel: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  headerTitle: { color: '#1C1700', fontWeight: 'bold' },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  resourceTitle: { flex: 1, fontWeight: '600' },
  playerCard: { marginHorizontal: 16, marginBottom: 8, borderRadius: 12, overflow: 'hidden' },
  controls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  transcriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  transcriptBody: { flex: 1, marginHorizontal: 16, marginBottom: 8 },
  transcriptCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  transcriptList: { paddingVertical: 4 },
  segment: { paddingVertical: 4, paddingHorizontal: 6, marginBottom: 2 },
  segmentWords: { flexDirection: 'row', flexWrap: 'wrap' },
  segmentWord: { fontSize: 15, lineHeight: 22 },
  // Add word modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalSheet: {
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
  modalTitle: { fontWeight: 'bold', marginBottom: 16 },
  suggestionsScroll: { maxHeight: 100, marginBottom: 12 },
  suggestionItem: { padding: 8, borderRadius: 6, marginBottom: 4 },
  listSelectorWrapper: {
    zIndex: 999,
    marginBottom: 16,
  },
  listSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  listDropdown: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    overflow: 'hidden',
  },
  listDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});

export default HomeScreen;
