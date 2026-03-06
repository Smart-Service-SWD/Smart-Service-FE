import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GraphqlUser } from '../../../../shared/api/adminGraphqlService';
import { styles } from '../styles';

interface MemberCardProps {
  item: GraphqlUser;
  badgePlacement: 'header' | 'footer';
  onToggleLock: (user: GraphqlUser) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({
  item,
  badgePlacement,
  onToggleLock,
}) => {
  const badge = (
    <View style={[styles.badge, item.isLocked ? styles.badgeLocked : styles.badgeActive]}>
      <Text style={[styles.badgeText, item.isLocked ? styles.badgeTextLocked : styles.badgeTextActive]}>
        {item.isLocked ? 'Đang khóa' : 'Đang hoạt động'}
      </Text>
    </View>
  );

  const lockAction = (
    <TouchableOpacity
      style={badgePlacement === 'header' ? styles.lockBtn : styles.lockBtnInline}
      onPress={() => onToggleLock(item)}
    >
      <Ionicons name={item.isLocked ? 'lock-open-outline' : 'lock-closed-outline'} size={16} color="#007AFF" />
      <Text style={styles.lockBtnText}>{item.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.fullName}</Text>
        {badgePlacement === 'header' ? badge : null}
      </View>

      <Text style={styles.meta}>{item.email}</Text>
      <Text style={styles.meta}>{item.phoneNumber || 'Chưa có số điện thoại'}</Text>

      {badgePlacement === 'header' ? (
        lockAction
      ) : (
        <View style={styles.row}>
          {badge}
          {lockAction}
        </View>
      )}
    </View>
  );
};
