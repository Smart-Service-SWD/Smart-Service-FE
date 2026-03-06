import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface ProfileActionItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
  isDanger?: boolean;
}

interface ProfileActionSectionProps {
  title: string;
  items: ProfileActionItem[];
}

export const ProfileActionSection: React.FC<ProfileActionSectionProps> = ({
  title,
  items,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.actionItem, isLast && styles.actionLast]}
            onPress={item.onPress}
          >
            <Ionicons name={item.icon} size={20} color={item.color} />
            <Text style={[styles.actionText, item.isDanger && styles.actionDangerText]}>
              {item.label}
            </Text>
            {!item.isDanger ? (
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
