import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface ReportStatCardProps {
  title: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const ReportStatCard: React.FC<ReportStatCardProps> = ({
  title,
  value,
  icon,
}) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Ionicons name={icon} size={20} color="#007AFF" />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
};
