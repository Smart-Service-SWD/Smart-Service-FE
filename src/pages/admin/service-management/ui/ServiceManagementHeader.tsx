import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface ServiceManagementHeaderProps {
  activeTab: 'services' | 'categories';
  onOpenAddService: () => void;
  onOpenAddCategory: () => void;
}

export const ServiceManagementHeader: React.FC<ServiceManagementHeaderProps> = ({
  activeTab,
  onOpenAddService,
  onOpenAddCategory,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Quản lý dịch vụ</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={activeTab === 'categories' ? onOpenAddCategory : onOpenAddService}
      >
        <Ionicons name="add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
