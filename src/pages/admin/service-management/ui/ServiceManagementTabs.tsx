import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface ServiceManagementTabsProps {
  activeTab: 'services' | 'categories';
  categoriesCount: number;
  onChangeTab: (tab: 'services' | 'categories') => void;
}

export const ServiceManagementTabs: React.FC<ServiceManagementTabsProps> = ({
  activeTab,
  categoriesCount,
  onChangeTab,
}) => {
  return (
    <View style={styles.tabRow}>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'services' && styles.tabButtonActive]}
        onPress={() => onChangeTab('services')}
      >
        <Text style={[styles.tabText, activeTab === 'services' && styles.tabTextActive]}>
          Dịch vụ
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'categories' && styles.tabButtonActive]}
        onPress={() => onChangeTab('categories')}
      >
        <Text style={[styles.tabText, activeTab === 'categories' && styles.tabTextActive]}>
          Danh mục ({categoriesCount})
        </Text>
      </TouchableOpacity>
    </View>
  );
};
