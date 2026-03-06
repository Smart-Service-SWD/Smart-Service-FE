import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface UserManagementFiltersProps {
  searchQuery: string;
  selectedRole: string;
  roleOptions: readonly string[];
  onChangeSearch: (value: string) => void;
  onSelectRole: (role: string) => void;
  getRoleLabel: (role: string) => string;
}

export const UserManagementFilters: React.FC<UserManagementFiltersProps> = ({
  searchQuery,
  selectedRole,
  roleOptions,
  onChangeSearch,
  onSelectRole,
  getRoleLabel,
}) => {
  return (
    <View style={styles.searchSection}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          value={searchQuery}
          onChangeText={onChangeSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        keyboardShouldPersistTaps="handled"
      >
        {roleOptions.map(role => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterButton,
              selectedRole === role && styles.filterButtonActive,
            ]}
            onPress={() => onSelectRole(role)}
          >
            <Text
              style={[
                styles.filterText,
                selectedRole === role && styles.filterTextActive,
              ]}
            >
              {role === 'all' ? 'Tất cả' : getRoleLabel(role)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};
