import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, IconButton, useTheme, ActivityIndicator } from 'react-native-paper';
import { Audio } from 'expo-av';

interface AudioPlayerProps {
  uri: string;
  compact?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ uri, compact = false }) => {
  const theme = useTheme();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playSound = async () => {
    try {
      setIsLoading(true);

      if (sound) {
        await sound.unloadAsync();
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      setSound(newSound);
      setIsPlaying(true);
      setIsLoading(false);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsLoading(false);
    }
  };

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync();
      setIsPlaying(false);
    }
  };

  if (compact) {
    return (
      <IconButton
        icon={isPlaying ? 'stop' : 'play'}
        mode="contained"
        size={20}
        onPress={isPlaying ? stopSound : playSound}
        disabled={isLoading}
        loading={isLoading}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        onPress={isPlaying ? stopSound : playSound}
        disabled={isLoading}
        loading={isLoading}
        icon={isPlaying ? 'stop' : 'play'}
        contentStyle={styles.buttonContent}
        style={isPlaying ? { backgroundColor: theme.colors.error } : {}}
      >
        {isPlaying ? 'Stop' : 'Play Recording'}
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  buttonContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
});

export default AudioPlayer;
