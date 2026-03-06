import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface RequestDetailHeaderProps {
  statusColor: string;
  onBack: () => void;
  onRefresh: () => void;
}

export const RequestDetailHeader: React.FC<RequestDetailHeaderProps> = ({
  statusColor,
  onBack,
  onRefresh,
}) => {
  return (
    <View style={[styles.header, { backgroundColor: statusColor }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
      <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
        <Ionicons name="refresh" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
