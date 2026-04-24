import React, { useState } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';
import { IconButton, Portal, Dialog, Button, Text, TextInput, useTheme } from 'react-native-paper';
import { useWords } from '../context/WordContext';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  iconColor?: string;
}

const FeedbackButton: React.FC<Props> = ({ iconColor = '#1C1700' }) => {
  const theme = useTheme();
  const { submitFeedback } = useWords();
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleOpen = () => { setText(''); setSubmitted(false); setError(''); setVisible(true); };
  const handleClose = () => { Keyboard.dismiss(); setVisible(false); };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await submitFeedback(text.trim());
      setSubmitted(true);
      setText('');
      setTimeout(() => setVisible(false), 1200);
    } catch {
      setError(t.feedback.sendError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <IconButton
        icon="lightbulb-outline"
        iconColor={iconColor}
        size={22}
        onPress={handleOpen}
        style={{ margin: 0 }}
      />
      <Portal>
        <Dialog visible={visible} onDismiss={handleClose}>
          <Dialog.Icon icon="lightbulb-outline" />
          <Dialog.Title style={{ textAlign: 'center' }}>{t.feedback.title}</Dialog.Title>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <Dialog.Content>
              {submitted ? (
                <Text
                  variant="bodyMedium"
                  style={{ textAlign: 'center', color: theme.colors.primary }}
                >
                  {t.feedback.thanks}
                </Text>
              ) : (
                <>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}
                  >
                    {t.feedback.subtitle}
                  </Text>
                  <TextInput
                    mode="outlined"
                    placeholder={t.feedback.placeholder}
                    value={text}
                    onChangeText={setText}
                    multiline
                    numberOfLines={5}
                    style={{ minHeight: 120 }}
                    autoFocus
                  />
                  {error ? (
                    <Text
                      variant="labelSmall"
                      style={{ color: theme.colors.error, marginTop: 6 }}
                    >
                      {error}
                    </Text>
                  ) : null}
                </>
              )}
            </Dialog.Content>
          </TouchableWithoutFeedback>
          {!submitted && (
            <Dialog.Actions>
              <Button onPress={handleClose} disabled={submitting}>{t.common.cancel}</Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={!text.trim() || submitting}
                loading={submitting}
              >
                {t.feedback.send}
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>
    </>
  );
};

export default FeedbackButton;
