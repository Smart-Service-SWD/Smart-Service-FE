import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface MemberScreenHeaderProps {
  title: string;
  addIcon: string;
  onPressAdd: () => void;
}

export const MemberScreenHeader: React.FC<MemberScreenHeaderProps> = ({
  title,
  addIcon,
  onPressAdd,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity style={styles.addBtn} onPress={onPressAdd}>
        <Ionicons name={addIcon as any} size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};
