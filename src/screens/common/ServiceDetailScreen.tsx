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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface Service {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  price: string;
  description: string;
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

  // Get category-specific information
  const getCategoryInfo = () => {
    const categoryDetails: Record<string, { color: string; description: string; features: string[] }> = {
      Electronics: {
        color: '#06B6D4',
        description: 'Expert electronics repair services with certified technicians. We handle smartphones, laptops, tablets, and all electronic devices with care and precision.',
        features: [
          'Certified electronics technicians',
          'Original parts guarantee',
          'Same-day service available',
          '90-day warranty on repairs',
          'Free diagnostic check',
          'Data protection guaranteed'
        ]
      },
      Electrical: {
        color: '#EF4444',
        description: 'Professional electrical services for homes and businesses. Licensed electricians with years of experience in installations, repairs, and maintenance.',
        features: [
          'Licensed & insured electricians',
          'Safety compliance guaranteed',
          'Emergency 24/7 service',
          'Free consultation & quote',
          'Quality materials used',
          '1-year workmanship warranty'
        ]
      },
      Legal: {
        color: '#8B5CF6',
        description: 'Expert legal consultation and services from qualified lawyers. Get professional advice on contracts, legal documents, and legal matters.',
        features: [
          'Qualified legal professionals',
          'Confidential consultation',
          'Transparent pricing',
          'Contract review & drafting',
          'Legal document preparation',
          'Court representation available'
        ]
      },
      'Real Estate': {
        color: '#10B981',
        description: 'Comprehensive real estate services including property valuation, consultation, and land surveys. Expert guidance for buying, selling, or investing in property.',
        features: [
          'Certified property valuators',
          'Market analysis included',
          'Legal documentation support',
          'Investment consultation',
          'Accurate land surveys',
          'Negotiation assistance'
        ]
      }
    };

    return categoryDetails[service.category] || categoryDetails.Electronics;
  };

  const categoryInfo = getCategoryInfo();

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
            colors={[categoryInfo.color, categoryInfo.color + 'CC']}
            style={styles.imagePlaceholder}
          >
            <Ionicons name="construct" size={80} color="#FFFFFF" />
          </LinearGradient>
        </View>

        {/* Service Info */}
        <View style={styles.infoCard}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '20' }]}>
            <Text style={[styles.categoryText, { color: categoryInfo.color }]}>{service.category}</Text>
          </View>
          
          <Text style={styles.serviceName}>{service.name}</Text>
          
          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={20} color="#FFB800" />
              <Text style={styles.rating}>{service.rating}</Text>
              <Text style={styles.reviews}>({service.reviews} reviews)</Text>
            </View>
            <Text style={styles.price}>{service.price}</Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Service</Text>
            <Text style={styles.description}>
              {service.description}
            </Text>
            <Text style={styles.description}>
              {categoryInfo.description}
            </Text>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's Included</Text>
            {categoryInfo.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={categoryInfo.color} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
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
            colors={[categoryInfo.color, categoryInfo.color + 'DD']}
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
    paddingVertical: 16,
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
