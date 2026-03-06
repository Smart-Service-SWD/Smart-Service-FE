import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  ServiceRequestDetail,
  STATUS_COLOR,
  STATUS_LABEL,
} from '../../../../shared/api/userService';
import { styles } from '../styles';

interface RequestCardProps {
  item: ServiceRequestDetail;
  onPress: (item: ServiceRequestDetail) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({ item, onPress }) => {
  const statusColor = STATUS_COLOR[item.status] ?? '#6B7280';
  const statusLabel = STATUS_LABEL[item.status] ?? item.status;
  const date = new Date(item.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <View style={[styles.badgeDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <Text style={styles.date}>{date}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

        {item.addressText ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color="#9CA3AF" />
            <Text style={styles.addressText} numberOfLines={1}>{item.addressText}</Text>
          </View>
        ) : null}

        <View style={styles.cardBottom}>
          {item.estimatedCost ? (
            <Text style={styles.price}>
              {item.estimatedCost.amount.toLocaleString('vi-VN')} {item.estimatedCost.currency}
            </Text>
          ) : (
            <Text style={styles.noPrice}>Chưa có giá</Text>
          )}
          <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
        </View>
      </View>
    </TouchableOpacity>
  );
};
