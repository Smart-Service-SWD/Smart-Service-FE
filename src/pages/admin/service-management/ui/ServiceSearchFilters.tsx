import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface ServiceSearchFiltersProps {
  searchQuery: string;
  selectedCategory: string;
  categoryFilters: string[];
  onChangeSearch: (value: string) => void;
  onSelectCategory: (value: string) => void;
}

export const ServiceSearchFilters: React.FC<ServiceSearchFiltersProps> = ({
  searchQuery,
  selectedCategory,
  categoryFilters,
  onChangeSearch,
  onSelectCategory,
}) => {
  return (
    <View style={styles.searchSection}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm dịch vụ..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={onChangeSearch}
        />
        {searchQuery.length > 0 ? (
          <TouchableOpacity onPress={() => onChangeSearch('')}>
            <Ionicons name="close-circle" size={16} color="#aaa" />
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {categoryFilters.map(category => (
          <TouchableOpacity
            key={category}
            style={[styles.filterButton, selectedCategory === category && styles.filterButtonActive]}
            onPress={() => onSelectCategory(category)}
          >
            <Text style={[styles.filterText, selectedCategory === category && styles.filterTextActive]}>
              {category === 'all' ? 'Tất cả' : category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
