import React, { useRef, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';

const SLIDE_ICONS = ['book-play', 'format-list-bulleted-type', 'microphone', 'calendar-check'];

interface Props {
  visible: boolean;
  onDone: () => void;
}

const OnboardingCarousel: React.FC<Props> = ({ visible, onDone }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useLanguage();

  const slides = t.onboarding.slides;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const goNext = () => {
    if (activeIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (activeIndex + 1) * width, animated: true });
    } else {
      onDone();
    }
  };

  const isLast = activeIndex === slides.length - 1;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 16, paddingTop: insets.top + 16 }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
        >
          {slides.map((slide, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
                <Icon name={SLIDE_ICONS[i] as any} size={52} color={theme.colors.primary} />
              </View>
              <Text variant="headlineSmall" style={styles.title}>
                {slide.title}
              </Text>
              <Text
                variant="bodyLarge"
                style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              >
                {slide.description}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === activeIndex ? theme.colors.primary : theme.colors.outlineVariant,
                  width: i === activeIndex ? 20 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          {!isLast ? (
            <Button onPress={onDone} textColor={theme.colors.onSurfaceVariant}>
              {t.onboarding.skip}
            </Button>
          ) : (
            <View style={{ width: 80 }} />
          )}
          <Button mode="contained" onPress={goNext} style={styles.nextButton}>
            {isLast ? t.onboarding.getStarted : t.onboarding.next}
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
  },
  nextButton: {
    minWidth: 120,
  },
});

export default OnboardingCarousel;
