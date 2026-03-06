import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { styles } from '../styles';

interface TopServiceItem {
  id: string;
  name: string;
  bookingCount: number;
  basePrice: number | string;
}

interface TopServicesCardProps {
  loading: boolean;
  services: TopServiceItem[];
}

export const TopServicesCard: React.FC<TopServicesCardProps> = ({
  loading,
  services,
}) => {
  return (
    <View style={styles.topServicesCard}>
      {loading ? (
        <ActivityIndicator color="#007AFF" />
      ) : services.length === 0 ? (
        <Text style={{ color: '#999', textAlign: 'center', padding: 12 }}>Chưa có dữ liệu</Text>
      ) : (
        services.map((service, index) => (
          <View key={service.id} style={styles.topServiceItem}>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.topServiceInfo}>
              <Text style={styles.topServiceName}>{service.name}</Text>
              <Text style={styles.topServiceStats}>
                {service.bookingCount > 0 ? `${service.bookingCount} lượt đặt` : 'Chưa có lịch đặt'}
                {' • '}
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(service.basePrice) || 0)}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
};
