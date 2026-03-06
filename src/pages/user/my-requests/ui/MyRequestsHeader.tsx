import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface MyRequestsHeaderProps {
  onCreateRequest: () => void;
}

export const MyRequestsHeader: React.FC<MyRequestsHeaderProps> = ({
  onCreateRequest,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Yêu cầu của tôi</Text>
      <TouchableOpacity style={styles.addBtn} onPress={onCreateRequest}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
