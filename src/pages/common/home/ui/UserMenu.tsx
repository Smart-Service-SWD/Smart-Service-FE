import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../home.styles';

interface UserMenuProps {
  fullName: string;
  role: string;
  onViewProfile: () => void;
  onLogout: () => void;
  onClose: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  fullName,
  role,
  onViewProfile,
  onLogout,
  onClose,
}) => {
  return (
    <>
      <TouchableOpacity style={styles.menuOverlay} onPress={onClose} />
      <View style={styles.dropdownMenu}>
        <Text style={styles.menuName}>{fullName}</Text>
        <Text style={styles.menuRole}>{role || 'User'}</Text>
        <View style={styles.menuDivider} />
        <TouchableOpacity style={styles.menuItem} onPress={onViewProfile}>
          <Ionicons name="person-circle-outline" size={18} color="#333" />
          <Text style={styles.menuItemText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#E53935" />
          <Text style={[styles.menuItemText, { color: '#E53935' }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};
