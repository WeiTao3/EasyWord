import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  Card,
  Button,
  useTheme,
  IconButton,
  Portal,
  Dialog,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useWords } from '../context/WordContext';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { uploadAudio, deleteAudio } from '../services/supabaseDataService';
import AudioRecorder from '../components/AudioRecorder';
import AudioPlayer from '../components/AudioPlayer';
import FeedbackButton from '../components/FeedbackButton';
import { useLanguage } from '../context/LanguageContext';

type RecordScreenRouteProp = RouteProp<{ RecordScreen: { wordId: string } }, 'RecordScreen'>;

const RecordScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RecordScreenRouteProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, updateWord } = useWords();
  const { user } = useAuth();
  const { isPremium } = useSubscription();
  const { t } = useLanguage();
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const wordId = route.params?.wordId;
  const word = state.words.find((w) => w.id === wordId);
  const listWords = word ? state.words.filter((w) => w.listId === word.listId) : [];
  const wordIndex = word ? listWords.findIndex((w) => w.id === word.id) : -1;

  if (!word) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Surface
          style={[styles.header, { paddingTop: insets.top }]}
          elevation={0}
        >
          <View style={styles.headerContent}>
            <IconButton
              icon="arrow-left"
              iconColor={theme.colors.onSurface}
              onPress={() => navigation.goBack()}
            />
            <Text variant="titleLarge">{t.record.title}</Text>
            <FeedbackButton iconColor={theme.colors.onSurface} />
          </View>
        </Surface>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={theme.colors.error} />
          <Text variant="titleMedium" style={{ marginTop: 16 }}>
            {t.record.wordNotFound}
          </Text>
        </View>
      </View>
    );
  }

  const handleRecordingComplete = async (uri: string) => {
    let audioUri = uri;
    if (isPremium && user) {
      setUploading(true);
      try {
        audioUri = await uploadAudio(uri, word.id, user.id);
      } catch {
        // Upload failed — fall back to local URI silently
      }
      setUploading(false);
    }
    updateWord({ ...word, audioUri });
  };

  const handleDeleteRecording = async () => {
    if (isPremium && user && word.audioUri?.startsWith('https://')) {
      await deleteAudio(word.id, user.id);
    }
    updateWord({ ...word, audioUri: null });
    setDeleteDialogVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface style={[styles.header, { paddingTop: insets.top }]} elevation={1}>
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onSurface}
            onPress={() => navigation.goBack()}
          />
          <Text variant="titleLarge">{t.record.title}</Text>
          <View style={{ width: 48 }} />
        </View>
      </Surface>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Word Card */}
        <Card style={styles.wordCard} mode="elevated">
          <Card.Content style={styles.wordContent}>
            <View style={styles.wordRow}>
              {wordIndex >= 0 && (
                <Text variant="headlineMedium" style={[styles.indexNumber, { color: theme.colors.onSurfaceVariant }]}>
                  {wordIndex + 1}.
                </Text>
              )}
              <Text variant="displaySmall" style={{ fontWeight: 'bold' }}>
                {word.word}
              </Text>
            </View>
            {word.pronunciation && (
              <Text
                variant="titleMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
              >
                {word.pronunciation}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Recorder */}
        <Card style={styles.recorderCard} mode="outlined">
          <Card.Content>
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              existingUri={word.audioUri}
            />
          </Card.Content>
        </Card>

        {/* Playback Section */}
        {(word.audioUri || uploading) && (
          <Card style={styles.playbackCard} mode="elevated">
            <Card.Content style={styles.playbackContent}>
              <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                {t.record.yourRecording}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Icon
                  name={uploading ? 'cloud-upload-outline' : isPremium ? 'cloud-check' : 'cloud-off-outline'}
                  size={14}
                  color={uploading || isPremium ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                <Text variant="labelSmall" style={{ marginLeft: 4, color: theme.colors.onSurfaceVariant }}>
                  {uploading ? t.record.syncing : isPremium ? t.record.synced : t.record.localOnly}
                </Text>
              </View>
              {word.audioUri && !uploading && <AudioPlayer uri={word.audioUri} />}
              {!uploading && (
                <Button
                  mode="text"
                  textColor={theme.colors.error}
                  onPress={() => setDeleteDialogVisible(true)}
                  style={{ marginTop: 16 }}
                  icon="delete"
                >
                  {t.record.deleteRecording}
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Tips */}
        <Card
          style={[styles.tipsCard, { backgroundColor: theme.colors.primaryContainer }]}
          mode="contained"
        >
          <Card.Content>
            <View style={styles.tipsHeader}>
              <Icon name="lightbulb" size={20} color={theme.colors.primary} />
              <Text
                variant="titleSmall"
                style={{ color: theme.colors.onPrimaryContainer, marginLeft: 8 }}
              >
                {t.record.tipsTitle}
              </Text>
            </View>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onPrimaryContainer, marginTop: 8, lineHeight: 20 }}
            >
              • {t.record.tip1}{'\n'}
              • {t.record.tip2}{'\n'}
              • {t.record.tip3}{'\n'}
              • {t.record.tip4}
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Delete Dialog */}
      <Portal>
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Icon icon="delete" />
          <Dialog.Title style={{ textAlign: 'center' }}>{t.record.deleteRecording}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              {t.record.deleteConfirm}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>{t.common.cancel}</Button>
            <Button onPress={handleDeleteRecording} textColor={theme.colors.error}>
              {t.common.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  wordCard: {
    marginBottom: 16,
  },
  wordContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  indexNumber: {
    fontWeight: 'bold',
  },
  recorderCard: {
    marginBottom: 16,
  },
  playbackCard: {
    marginBottom: 16,
  },
  playbackContent: {
    alignItems: 'center',
  },
  tipsCard: {
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default RecordScreen;
