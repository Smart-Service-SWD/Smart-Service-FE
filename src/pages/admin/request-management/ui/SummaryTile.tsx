import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface SummaryTileProps {
  label: string;
  count: number;
  color: string;
}

export const SummaryTile: React.FC<SummaryTileProps> = ({ label, count, color }) => {
  return (
    <View style={styles.summaryTile}>
      <Text style={[styles.summaryCount, { color }]}>{count}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
};
