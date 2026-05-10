import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Surface, Text, Card, useTheme, IconButton, Portal, Dialog, Button, TextInput, Snackbar, Menu, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useWords } from '../context/WordContext';
import { WordList } from '../types';
import { getToday } from '../utils/dateUtils';
import FeedbackButton from '../components/FeedbackButton';
import { useLanguage } from '../context/LanguageContext';

type CalendarDayRouteProp = RouteProp<
  { CalendarDay: { date: string; listNos: string[] } },
  'CalendarDay'
>;

const isValidDate = (str: string) => /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));

const CalendarDayScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<CalendarDayRouteProp>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { state, toggleListDateCheck, moveCalendarEntry, removeCalendarBatch } = useWords();
  const { t, language } = useLanguage();

  const { date, listNos } = route.params;
  const [year, monthIdx, day] = date.split('-').map(Number);
  const displayDate = language === 'zh'
    ? `${year}年${monthIdx}月${day}日`
    : `${t.months[monthIdx - 1]} ${day}, ${year}`;

  // Move dialog state
  const [moveDialogList, setMoveDialogList] = useState<WordList | null>(null);
  const [targetDate, setTargetDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [snackbar, setSnackbar] = useState('');

  // Delete dialog state
  const [deleteDialogList, setDeleteDialogList] = useState<WordList | null>(null);

  // Three-dot menu state
  const [menuVisible, setMenuVisible] = useState<string | null>(null);

  const isToday = date === getToday();

  const isChecked = (listId: string) =>
    (state.checkedListDates[listId] || []).includes(date);

  const matchedLists = state.lists.filter(
    (l) => l.listNo && listNos.includes(l.listNo)
  );

  const wordCountFor = (listId: string) =>
    state.words.filter((w) => w.listId === listId).length;

  const handleMoveOpen = (item: WordList) => {
    setMoveDialogList(item);
    setTargetDate('');
    setDateError('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialogList?.listNo) return;
    await removeCalendarBatch(deleteDialogList.listNo, date);
    setSnackbar(t.calendarDay.removed(deleteDialogList.name));
    setDeleteDialogList(null);
    navigation.goBack();
  };

  const handleMoveConfirm = async () => {
    if (!isValidDate(targetDate)) {
      setDateError(t.calendarDay.invalidDate);
      return;
    }
    if (targetDate === date) {
      setDateError(t.calendarDay.sameDateError);
      return;
    }
    if (!moveDialogList?.listNo) return;
    await moveCalendarEntry(moveDialogList.listNo, date, targetDate);
    setMoveDialogList(null);
    setSnackbar(t.calendarDay.movedTo(targetDate));
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: WordList }) => {
    const count = wordCountFor(item.id);
    return (
      <Card
        style={styles.listCard}
        mode="elevated"
        onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name, hiddenByDefault: true })}
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
              <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>
                {item.description}
              </Text>
            ) : null}
            <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
              {count} word{count !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Three-dot menu */}
          <Menu
            visible={menuVisible === item.id}
            onDismiss={() => setMenuVisible(null)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => setMenuVisible(item.id)}
              />
            }
          >
            <Menu.Item
              leadingIcon="calendar-arrow-right"
              title={t.calendarDay.moveToDate}
              onPress={() => { setMenuVisible(null); handleMoveOpen(item); }}
            />
            <Divider />
            <Menu.Item
              leadingIcon="calendar-remove"
              title={t.calendarDay.removeFromCalendar}
              titleStyle={{ color: theme.colors.error }}
              onPress={() => { setMenuVisible(null); setDeleteDialogList(item); }}
            />
          </Menu>

          {/* Checkbox with hint — only tappable on today */}
          <View style={styles.checkboxWrapper}>
            {!isChecked(item.id) && isToday && (
              <Text variant="labelSmall" style={[styles.checkHint, { color: theme.colors.primary }]}>
                {t.calendarDay.checkHint}
              </Text>
            )}
            <TouchableOpacity
              onPress={() => isToday && toggleListDateCheck(item.id, date)}
              disabled={!isToday}
              style={[
                styles.checkbox,
                {
                  borderColor: isToday ? theme.colors.primary : theme.colors.outlineVariant,
                  backgroundColor: isChecked(item.id) ? theme.colors.primary : 'transparent',
                  opacity: isToday ? 1 : 0.4,
                },
              ]}
            >
              {isChecked(item.id) && (
                <Icon name="check" size={14} color={theme.colors.onPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface
        style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: insets.top }]}
        elevation={0}
      >
        <View style={styles.headerRow}>
          <IconButton icon="arrow-left" iconColor="#1C1700" onPress={() => navigation.goBack()} />
          <View style={styles.headerText}>
            <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
              {displayDate}
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {t.calendarDay.listsScheduled(matchedLists.length)}
            </Text>
          </View>
          <FeedbackButton />
        </View>
      </Surface>

      {matchedLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="calendar-blank" size={64} color={theme.colors.outline} />
          <Text variant="titleMedium" style={{ marginTop: 16 }}>{t.calendarDay.noListsScheduled}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {t.calendarDay.noListsDesc}
          </Text>
        </View>
      ) : (
        <FlatList
          data={matchedLists}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Delete from Calendar Dialog */}
      <Portal>
        <Dialog visible={!!deleteDialogList} onDismiss={() => setDeleteDialogList(null)}>
          <Dialog.Icon icon="calendar-remove" />
          <Dialog.Title style={{ textAlign: 'center' }}>{t.calendarDay.removeFromCalendar}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>
              {t.calendarDay.removeConfirm(deleteDialogList?.name ?? '')}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogList(null)}>{t.common.cancel}</Button>
            <Button onPress={handleDeleteConfirm} textColor={theme.colors.error}>{t.common.delete}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Move Dialog */}
      <Portal>
        <Dialog visible={!!moveDialogList} onDismiss={() => setMoveDialogList(null)}>
          <Dialog.Title>{t.calendarDay.moveToDate}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 12, color: theme.colors.onSurfaceVariant }}>
              {t.calendarDay.movingFrom(moveDialogList?.name ?? '', date)}
            </Text>
            <TextInput
              label={t.calendarDay.targetDateLabel}
              value={targetDate}
              onChangeText={(v) => { setTargetDate(v); setDateError(''); }}
              mode="outlined"
              keyboardType="numbers-and-punctuation"
              error={!!dateError}
              autoFocus
            />
            {dateError ? (
              <Text variant="labelSmall" style={{ color: theme.colors.error, marginTop: 4 }}>
                {dateError}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMoveDialogList(null)}>{t.common.cancel}</Button>
            <Button onPress={handleMoveConfirm} disabled={!targetDate.trim()}>{t.calendarDay.move}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={2500}>
        {snackbar}
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
  headerTitle: { color: '#1C1700', fontWeight: 'bold' },
  headerSubtitle: { color: 'rgba(28,23,0,0.6)' },
  list: { padding: 16, paddingBottom: 100 },
  listCard: { marginBottom: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  iconWrapper: { marginRight: 12 },
  cardText: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  checkboxWrapper: {
    alignItems: 'center',
    marginLeft: 4,
  },
  checkHint: {
    textAlign: 'center',
    marginBottom: 2,
    lineHeight: 13,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CalendarDayScreen;
