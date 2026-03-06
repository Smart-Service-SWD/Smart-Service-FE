import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ServiceListItem } from '../../../../shared/api/adminGraphqlService';
import { getServiceCategoryColor, getServiceCategoryIcon } from '../../../../features/common/service-list/model/constants';
import { styles } from '../styles';

interface ServiceCardProps {
  item: ServiceListItem;
  onPress: (service: ServiceListItem) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.serviceIcon}>
        <Ionicons
          name={getServiceCategoryIcon(item.categoryName)}
          size={32}
          color={getServiceCategoryColor(item.categoryName)}
        />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description || 'No description available'}
        </Text>
        <View style={styles.serviceFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFB800" />
            <Text style={styles.rating}>5.0</Text>
            <Text style={styles.reviews}>({item.bookingCount || 0})</Text>
          </View>
          <Text style={styles.price}>{item.basePrice} VND</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );
};
