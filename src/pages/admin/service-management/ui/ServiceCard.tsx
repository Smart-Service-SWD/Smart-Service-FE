import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Service } from '../../../../features/admin/service-management/model/types';
import { styles } from '../styles';

interface ServiceCardProps {
  item: Service;
  formatCurrency: (amount: number) => string;
  formatDuration: (minutes: number) => string;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  item,
  formatCurrency,
  formatDuration,
  onEdit,
  onDelete,
}) => {
  return (
    <View style={[styles.serviceCard, !item.isActive && styles.serviceCardInactive]}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={styles.serviceStatusBadge}>
          <View style={[styles.activeDot, { backgroundColor: item.isActive ? '#34C759' : '#FF3B30' }]} />
          <Text style={[styles.activeText, { color: item.isActive ? '#34C759' : '#FF3B30' }]}>
            {item.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </Text>
        </View>
      </View>

      <View style={styles.serviceDetails}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.servicePrice}>{formatCurrency(item.price)}</Text>
        <Text style={styles.serviceDuration}>{formatDuration(item.duration)}</Text>
      </View>

      <View style={styles.serviceStats}>
        <Ionicons name="calendar-outline" size={13} color="#999" />
        <Text style={styles.statText}>{item.bookingCount > 0 ? `${item.bookingCount} lượt đặt` : 'Chưa có lịch đặt'}</Text>
        <Ionicons name="time-outline" size={13} color="#999" style={{ marginLeft: 10 }} />
        <Text style={styles.statText}>{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</Text>
      </View>

      <View style={styles.serviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF15' }]}
          onPress={() => onEdit(item)}
        >
          <Ionicons name="pencil" size={14} color="#007AFF" />
          <Text style={[styles.actionText, { color: '#007AFF' }]}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF3B3015' }]}
          onPress={() => onDelete(item)}
        >
          <Ionicons name="trash" size={14} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
