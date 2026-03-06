import React from 'react';
import { TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface MemberSearchBarProps {
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}

export const MemberSearchBar: React.FC<MemberSearchBarProps> = ({
  value,
  placeholder,
  onChangeText,
}) => {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={18} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};
