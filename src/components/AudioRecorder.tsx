import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text, useTheme, Surface, Chip } from 'react-native-paper';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface AudioRecorderProps {
  onRecordingComplete: (uri: string) => void;
  existingUri?: string | null;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  existingUri,
}) => {
  const theme = useTheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      setRecordingDuration(0);
      pulseAnim.setValue(1);
    }
    return () => {
      clearInterval(interval);
      pulseAnim.stopAnimation();
    };
  }, [isRecording, pulseAnim]);

  const startRecording = async () => {
    try {
      if (!permissionResponse?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) {
          return;
        }
      }

      setIsLoading(true);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsLoading(false);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsLoading(true);
      await recording.stopAndUnloadAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      setIsLoading(false);

      if (uri) {
        onRecordingComplete(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {existingUri && !isRecording && (
        <Chip icon="check-circle" style={styles.existingChip} textStyle={{ color: '#4CAF50' }}>
          Recording saved
        </Chip>
      )}

      <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnim : 1 }] }}>
        <Surface
          style={[
            styles.recordButton,
            {
              backgroundColor: isRecording ? theme.colors.error : theme.colors.primary,
            },
          ]}
          elevation={4}
        >
          <Icon
            name={isRecording ? 'stop' : 'microphone'}
            size={48}
            color="#fff"
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
          />
        </Surface>
      </Animated.View>

      {isRecording && (
        <View style={styles.durationContainer}>
          <View style={[styles.recordingDot, { backgroundColor: theme.colors.error }]} />
          <Text variant="headlineMedium" style={{ fontWeight: '600' }}>
            {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}

      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant, marginTop: 16, textAlign: 'center' }}
      >
        {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  existingChip: {
    backgroundColor: '#E8F5E9',
    marginBottom: 16,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
});

export default AudioRecorder;
