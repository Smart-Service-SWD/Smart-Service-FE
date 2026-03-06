import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface AnalysisDetailsCardProps {
  title: string;
  value: string;
}

export const AnalysisDetailsCard: React.FC<AnalysisDetailsCardProps> = ({
  title,
  value,
}) => {
  if (!value) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.suggestText}>{value}</Text>
    </View>
  );
};
