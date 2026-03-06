import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles';

export const ServiceListEmptyState: React.FC = () => {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name="construct-outline" size={64} color="#CCC" />
      <Text style={styles.emptyText}>No services found in this category</Text>
    </View>
  );
};
