import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FEATURED_SERVICE_COLORS } from '../home.constants';
import { FeaturedService } from '../home.types';
import { styles } from '../home.styles';

interface FeaturedServiceCardProps {
  item: FeaturedService;
  onPress: (service: FeaturedService) => void;
}

export const FeaturedServiceCard: React.FC<FeaturedServiceCardProps> = ({
  item,
  onPress,
}) => {
  const serviceColor = FEATURED_SERVICE_COLORS[item.category] ?? '#007AFF';

  return (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => onPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.serviceImageContainer}>
        <View style={[styles.servicePlaceholder, { backgroundColor: serviceColor }]}>
          <Ionicons name="checkmark-circle" size={56} color="#fff" />
        </View>
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}</Text>
            <Text style={styles.discountLabel}>OFF</Text>
          </View>
        )}
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.serviceCategory}>{item.category}</Text>
        <View style={styles.serviceFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="document-text-outline" size={16} color="#6B7280" />
            <Text style={styles.reviews}>{item.reviews} lượt đặt</Text>
          </View>
        </View>
        <Text style={styles.price}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
};
