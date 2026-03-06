import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface QuickActionsSectionProps {
  onOpenAssignments: () => void;
  onLogout: () => void;
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  onOpenAssignments,
  onLogout,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
      <TouchableOpacity style={styles.actionButton} onPress={onOpenAssignments}>
        <Ionicons name="briefcase-outline" size={22} color="#34C759" />
        <Text style={styles.actionText}>Danh sách assignment của tôi</Text>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, styles.logoutButton]} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
        <Text style={[styles.actionText, { color: '#FF3B30' }]}>Đăng xuất</Text>
        <Ionicons name="chevron-forward" size={18} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
};
