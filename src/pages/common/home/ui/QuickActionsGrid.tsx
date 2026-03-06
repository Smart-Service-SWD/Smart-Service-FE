import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../home.styles';

interface QuickActionsGridProps {
  onCreateRequest: () => void;
  onOpenMyRequests: () => void;
  onOpenServiceCatalog: () => void;
  onOpenProfile: () => void;
}

const QUICK_ACTIONS = [
  {
    key: 'new-request',
    label: 'Tạo yêu cầu',
    icon: 'add-circle-outline' as keyof typeof Ionicons.glyphMap,
    color: '#007AFF',
    onPressKey: 'onCreateRequest',
  },
  {
    key: 'my-requests',
    label: 'Yêu cầu của tôi',
    icon: 'clipboard-outline' as keyof typeof Ionicons.glyphMap,
    color: '#34C759',
    onPressKey: 'onOpenMyRequests',
  },
  {
    key: 'service-catalog',
    label: 'Danh mục dịch vụ',
    icon: 'sparkles-outline' as keyof typeof Ionicons.glyphMap,
    color: '#FF9500',
    onPressKey: 'onOpenServiceCatalog',
  },
  {
    key: 'profile',
    label: 'Tài khoản',
    icon: 'person-outline' as keyof typeof Ionicons.glyphMap,
    color: '#5856D6',
    onPressKey: 'onOpenProfile',
  },
] as const;

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({
  onCreateRequest,
  onOpenMyRequests,
  onOpenServiceCatalog,
  onOpenProfile,
}) => {
  const actionMap = {
    onCreateRequest,
    onOpenMyRequests,
    onOpenServiceCatalog,
    onOpenProfile,
  };

  return (
    <View style={styles.quickActions}>
      {QUICK_ACTIONS.map(action => (
        <TouchableOpacity
          key={action.key}
          style={styles.quickAction}
          onPress={actionMap[action.onPressKey]}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
            <Ionicons name={action.icon} size={24} color={action.color} />
          </View>
          <View style={styles.quickActionSpacer} />
          <Text style={styles.quickActionText}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
