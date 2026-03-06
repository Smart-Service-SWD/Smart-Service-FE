import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GraphqlUser } from '../../../../shared/api/adminGraphqlService';
import { styles } from '../styles';

type UserActionType = 'edit' | 'suspend' | 'delete';

interface UserCardProps {
  item: GraphqlUser;
  getRoleColor: (role: string) => string;
  getRoleLabel: (role: string) => string;
  onOpenUserDetail: (user: GraphqlUser) => void;
  onAction: (user: GraphqlUser, action: UserActionType) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  item,
  getRoleColor,
  getRoleLabel,
  onOpenUserDetail,
  onAction,
}) => {
  const roleColor = getRoleColor(item.role);

  return (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => onOpenUserDetail(item)}
    >
      <View style={styles.userHeader}>
        <View>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={styles.userBadges}>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '20' }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>
          {item.isLocked ? (
            <View style={[styles.roleBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.roleText, { color: '#B91C1C' }]}>Đang khóa</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userPhone}>{item.phoneNumber || 'Chưa có số điện thoại'}</Text>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF20' }]}
          onPress={() => onAction(item, 'edit')}
        >
          <Ionicons name="pencil" size={16} color="#007AFF" />
          <Text style={[styles.actionText, { color: '#007AFF' }]}>Sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF950020' }]}
          onPress={() => onAction(item, 'suspend')}
        >
          <Ionicons name={item.isLocked ? 'lock-open-outline' : 'ban'} size={16} color="#FF9500" />
          <Text style={[styles.actionText, { color: '#FF9500' }]}>
            {item.isLocked ? 'Mở khóa' : 'Khóa'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF3B3020' }]}
          onPress={() => onAction(item, 'delete')}
        >
          <Ionicons name="trash" size={16} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};
