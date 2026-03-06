import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

interface AgentStatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: number | string;
  color: string;
}

export const AgentStatCard: React.FC<AgentStatCardProps> = ({
  icon,
  title,
  value,
  color,
}) => {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
};
