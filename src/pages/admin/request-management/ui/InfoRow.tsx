import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface InfoRowProps {
  icon: string;
  text: string;
  maxLines?: number;
}

export const InfoRow: React.FC<InfoRowProps> = ({ icon, text, maxLines = 2 }) => {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={13} color="#999" style={{ marginTop: 1 }} />
      <Text style={styles.infoText} numberOfLines={maxLines}>{text}</Text>
    </View>
  );
};
