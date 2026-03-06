import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useServiceDetail } from '../../features/common/service-detail/model/useServiceDetail';
import { styles } from './service-detail/styles';
import { ServiceDetailScreenProps } from './service-detail/types';

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({ navigation, route }) => {
  const { service } = route.params;
  const { theme, handleBookService } = useServiceDetail({ navigation, service });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0066CC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-social-outline" size={24} color="#0066CC" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <LinearGradient
            colors={[theme.color, theme.color + 'CC']}
            style={styles.imagePlaceholder}
          >
            <Ionicons name={theme.icon} size={80} color="#FFFFFF" />
          </LinearGradient>
        </View>

        <View style={styles.infoCard}>
          <View style={[styles.categoryBadge, { backgroundColor: theme.color + '20' }]}>
            <Text style={[styles.categoryText, { color: theme.color }]}>{service.categoryName || service.category}</Text>
          </View>

          <Text style={styles.serviceName}>{service.name}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#FFB800" />
              <Text style={styles.rating}>5.0</Text>
              <Text style={styles.reviews}>({service.bookingCount || 0} reviews)</Text>
            </View>
            <Text style={styles.price}>
              {service.basePrice !== undefined
                ? `${service.basePrice.toLocaleString('vi-VN')} VND`
                : service.price}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Service</Text>
            <Text style={styles.description}>
              {service.description || 'No detailed description available.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookService}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.color, theme.color + 'DD']}
            style={styles.bookButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.bookButtonText}>Book Service Now</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};
