import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

interface ProfileHeaderCardProps {
  name: string;
  roleLabel: string;
  accentColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const ProfileHeaderCard: React.FC<ProfileHeaderCardProps> = ({
  name,
  roleLabel,
  accentColor,
  icon,
}) => {
  return (
    <View style={styles.headerCard}>
      <View style={[styles.avatarContainer, { backgroundColor: accentColor }]}>
        <Ionicons name={icon} size={50} color="#fff" />
      </View>
      <Text style={styles.name}>{name}</Text>
      <View style={[styles.roleBadge, { backgroundColor: accentColor }]}>
        <Text style={styles.roleText}>{roleLabel}</Text>
      </View>
    </View>
  );
};
