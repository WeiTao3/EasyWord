import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { hasSeenTabTooltip, markTabTooltipSeen } from '../utils/onboarding';

interface Props {
  tabKey: string;
  message: string;
  icon: string;
}

const TabTooltip: React.FC<Props> = ({ tabKey, message, icon }) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      hasSeenTabTooltip(tabKey).then((seen) => {
        if (!seen) setVisible(true);
      });
    }, [tabKey])
  );

  const handleDismiss = async () => {
    setVisible(false);
    await markTabTooltipSeen(tabKey);
  };

  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={[styles.card, { backgroundColor: theme.colors.inverseSurface }]}>
        <Icon name={icon as any} size={20} color={theme.colors.inverseOnSurface} style={{ marginRight: 10 }} />
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: theme.colors.inverseOnSurface }]}
        >
          {message}
        </Text>
        <TouchableOpacity onPress={handleDismiss} hitSlop={12} style={{ marginLeft: 8 }}>
          <Icon name="close" size={18} color={theme.colors.inverseOnSurface} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 104,
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  message: {
    flex: 1,
    lineHeight: 20,
  },
});

export default TabTooltip;
