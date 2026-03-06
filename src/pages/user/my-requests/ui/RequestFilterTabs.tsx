import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import {
  FilterStatus,
  REQUEST_FILTER_TABS,
} from '../../../../features/user/my-requests/model/constants';
import { styles } from '../styles';

interface RequestFilterTabsProps {
  filter: FilterStatus;
  onChangeFilter: (value: FilterStatus) => void;
}

export const RequestFilterTabs: React.FC<RequestFilterTabsProps> = ({
  filter,
  onChangeFilter,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}
    >
      {REQUEST_FILTER_TABS.map(tab => (
        <TouchableOpacity
          key={tab.value}
          style={[styles.filterTab, filter === tab.value && styles.filterTabActive]}
          onPress={() => onChangeFilter(tab.value)}
        >
          <Text style={[styles.filterTabText, filter === tab.value && styles.filterTabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
