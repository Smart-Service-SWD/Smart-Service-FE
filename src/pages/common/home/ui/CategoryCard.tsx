import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceCategory } from '../home.types';
import { styles } from '../home.styles';

interface CategoryCardProps {
  item: ServiceCategory;
  onPress: (category: ServiceCategory) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryContainer, { backgroundColor: `${item.color}15` }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <View style={{ height: 8 }} />
      <Text style={styles.categoryLabel} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};
