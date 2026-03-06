import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface Service {
  id: string;
  name: string;
  category: string;
  categoryName?: string;
  rating: number;
  reviews: number;
  price: string;
  basePrice?: number;
  description: string;
  bookingCount?: number;
}

type RootStackParamList = {
  ServiceDetail: { service: Service };
  Profile: undefined;
  CreateRequest: { service: Service };
};

type ServiceDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceDetail'>;
type ServiceDetailScreenRouteProp = RouteProp<RootStackParamList, 'ServiceDetail'>;

interface ServiceDetailScreenProps {
  navigation: ServiceDetailScreenNavigationProp;
  route: ServiceDetailScreenRouteProp;
}

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({ navigation, route }) => {
  const { service } = route.params;
  const { user, token } = useAuth();
  const isAuthenticated = !!user && !!token;

  // Get category-specific UI information
  const getCategoryTheme = (categoryName: string) => {
    const themes: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
      Electronics: { color: '#06B6D4', icon: 'hardware-chip-outline' },
      Electrical: { color: '#EF4444', icon: 'flash-outline' },
      Legal: { color: '#8B5CF6', icon: 'document-text-outline' },
      'Real Estate': { color: '#10B981', icon: 'home-outline' },
    };
    return themes[categoryName] || { color: '#0066CC', icon: 'construct-outline' };
  };

  const theme = getCategoryTheme(service.categoryName || service.category);

  const handleBookService = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please login to book this service',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Login',
            onPress: () => navigation.navigate('Profile'),
          },
        ]
      );
      return;
    }

    // If authenticated, proceed to create request
    navigation.navigate('CreateRequest', { service });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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
        {/* Service Image Placeholder */}
        <View style={styles.imageContainer}>
          <LinearGradient
            colors={[theme.color, theme.color + 'CC']}
            style={styles.imagePlaceholder}
          >
            <Ionicons name={theme.icon} size={80} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Service Info */}
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
            <Text style={styles.price}>{service.basePrice !== undefined ? `${service.basePrice.toLocaleString('vi-VN')} VND` : service.price}</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Service</Text>
            <Text style={styles.description}>
              {service.description || 'No detailed description available.'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Book Button */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 250,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 20,
    minHeight: 400,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  reviews: {
    fontSize: 14,
    color: '#999',
    marginLeft: 6,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0066CC',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#424242',
    marginLeft: 10,
    fontWeight: '500',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0066CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
