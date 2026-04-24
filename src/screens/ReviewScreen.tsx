import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView, RefreshControl } from 'react-native';
import { Surface, Text, useTheme, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useWords } from '../context/WordContext';
import { getToday } from '../utils/dateUtils';
import FeedbackButton from '../components/FeedbackButton';
import TabTooltip from '../components/TabTooltip';
import OnboardingCarousel from '../components/OnboardingCarousel';
import { useLanguage } from '../context/LanguageContext';


// Heights of fixed UI elements (approximate)
const HEADER_CONTENT_HEIGHT = 72;  // title + year + paddingBottom
const MONTH_NAV_HEIGHT = 52;
const DAY_LABELS_HEIGHT = 28;
const TAB_BAR_HEIGHT = 80;
const GRID_PADDING = 16; // 8 top + 8 bottom

const ReviewScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { state, refreshCalendarData, cleanupOrphanedCalendarEntries } = useWords();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cleanupOrphanedCalendarEntries();
    }, [cleanupOrphanedCalendarEntries])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCalendarData();
    setRefreshing(false);
  }, [refreshCalendarData]);
  const { height: windowHeight } = useWindowDimensions();

  const today = getToday();
  const todayDate = new Date(today);

  const [year, setYear] = useState(todayDate.getFullYear());
  const [month, setMonth] = useState(todayDate.getMonth());

  const goToPrev = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const goToNext = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const numRows = cells.length / 7;

  // Calculate cell height to fill the screen exactly
  const headerHeight = insets.top + HEADER_CONTENT_HEIGHT;
  const availableForGrid =
    windowHeight - headerHeight - MONTH_NAV_HEIGHT - DAY_LABELS_HEIGHT - TAB_BAR_HEIGHT - GRID_PADDING;
  const cellHeight = Math.floor(availableForGrid / numRows);

  // How many badges fit per cell
  const DAY_NUMBER_HEIGHT = 20;
  const BADGE_HEIGHT = 15;
  const CELL_PADDING = 8;
  const maxBadges = Math.max(0, Math.floor((cellHeight - DAY_NUMBER_HEIGHT - CELL_PADDING) / BADGE_HEIGHT));

  const dateKey = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const handleDayPress = (day: number) => {
    const key = dateKey(day);
    const entries = state.calendarEntries[key] || [];
    if (entries.length === 0) return;
    navigation.navigate('CalendarDay', { date: key, listNos: entries });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <Surface
        style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top + 16 }]}
        elevation={0}
      >
        <View style={styles.headerRow}>
          <View>
            <Text variant="headlineMedium" style={styles.headerTitle}>{t.review.title}</Text>
            <Text variant="bodyMedium" style={styles.headerYear}>{year}</Text>
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

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <View style={styles.body}>
        {/* Month navigation */}
        <View style={[styles.monthNav, { height: MONTH_NAV_HEIGHT }]}>
          <TouchableOpacity onPress={goToPrev} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: theme.colors.primary }]}>‹</Text>
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.monthName}>{t.months[month]}</Text>
          <TouchableOpacity onPress={goToNext} style={styles.navBtn}>
            <Text style={[styles.navArrow, { color: theme.colors.primary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day-of-week labels */}
        <View style={[styles.row, { height: DAY_LABELS_HEIGHT }]}>
          {t.dayLabels.map((d) => (
            <View key={d} style={styles.dayLabelCell}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {Array.from({ length: numRows }, (_, rowIdx) => (
            <View key={rowIdx} style={[styles.row, { height: cellHeight }]}>
              {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
                if (day === null) {
                  return <View key={colIdx} style={styles.cell} />;
                }
                const key = dateKey(day);
                const entries = state.calendarEntries[key] || [];
                const isToday = key === today;
                const hasEntries = entries.length > 0;
                const visibleEntries = entries.slice(0, maxBadges > 0 && entries.length > maxBadges ? maxBadges - 1 : maxBadges);
                const hasMore = entries.length > visibleEntries.length;

                return (
                  <TouchableOpacity
                    key={colIdx}
                    style={[
                      styles.cell,
                      isToday && { backgroundColor: theme.colors.primaryContainer, borderRadius: 8 },
                      hasEntries && { borderRadius: 8 },
                    ]}
                    onPress={() => handleDayPress(day)}
                    activeOpacity={hasEntries ? 0.7 : 1}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isToday && { color: theme.colors.primary, fontWeight: 'bold' },
                        { color: isToday ? theme.colors.primary : theme.colors.onSurface },
                      ]}
                    >
                      {day}
                    </Text>
                    {visibleEntries.map((no) => (
                      <View
                        key={no}
                        style={[styles.entryBadge, { backgroundColor: theme.colors.primary, height: BADGE_HEIGHT }]}
                      >
                        <Text style={[styles.entryText, { color: theme.colors.onPrimary }]} numberOfLines={1}>
                          #{no}
                        </Text>
                      </View>
                    ))}
                    {hasMore && (
                      <View
                        style={[styles.entryBadge, { backgroundColor: theme.colors.outline, height: BADGE_HEIGHT }]}
                      >
                        <Text style={[styles.entryText, { color: theme.colors.surface }]}>…</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
      </ScrollView>
      <TabTooltip
        tabKey="review"
        icon="head-lightbulb"
        message="Tap a date with badges to see your scheduled lists. Check them off as you review."
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
  headerTitle: { color: '#1C1700', fontWeight: 'bold' },
  headerYear: { color: 'rgba(28,23,0,0.6)', marginTop: 2 },
  body: { flex: 1, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 32, lineHeight: 36 },
  monthName: { fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  dayLabelCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flex: 1 },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 4,
    paddingHorizontal: 1,
    overflow: 'hidden',
  },
  dayNumber: { fontSize: 12, lineHeight: 16, marginBottom: 2 },
  entryBadge: {
    borderRadius: 3,
    paddingHorizontal: 2,
    marginTop: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryText: { fontSize: 8, fontWeight: 'bold' },
});

export default ReviewScreen;
