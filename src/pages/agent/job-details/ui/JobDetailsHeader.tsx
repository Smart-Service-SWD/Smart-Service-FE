import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface JobDetailsHeaderProps {
  onBack: () => void;
}

export const JobDetailsHeader: React.FC<JobDetailsHeaderProps> = ({ onBack }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chi tiết công việc</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
};
