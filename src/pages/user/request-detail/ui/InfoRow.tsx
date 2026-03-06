import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#6B7280" />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
};
