import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Type Definitions
interface Banner {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ServiceCategory {
  id: number;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface FeaturedService {
  id: number;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  price: string;
  image: string;
  discount?: string;
}

interface DesignToken {
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  elevation: {
    level1: ViewStyle;
    level2: ViewStyle;
    level3: ViewStyle;
  };
  colors: {
    primary: string;
    onPrimary: string;
    primaryContainer: string;
    onPrimaryContainer: string;
    surface: string;
    onSurface: string;
    surfaceVariant: string;
    onSurfaceVariant: string;
    background: string;
    outline: string;
  };
}

type RootStackParamList = {
  Home: undefined;
  ServiceList: { category: string };
  ServiceDetail: { service: FeaturedService };
  Profile: undefined;
  Camera: undefined;
  History: undefined;
  Promotions: undefined;
  Support: undefined;
  AllServices: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get('window');

// Material Design 3 - Design Tokens
const MD3: DesignToken = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 28,
  },
  elevation: {
    level1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    level2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    level3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  colors: {
    primary: '#6750A4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#EADDFF',
    onPrimaryContainer: '#21005D',
    surface: '#FFFFFF',
    onSurface: '#1C1B1F',
    surfaceVariant: '#E7E0EC',
    onSurfaceVariant: '#49454F',
    background: '#FEF7FF',
    outline: '#79747E',
  },
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);

  // Mock data for banners/promotions
  const banners: Banner[] = [
    {
      id: 1,
      title: 'Professional Home Services',
      subtitle: 'Trusted Experts',
      description: 'Book in seconds',
      color: '#4F46E5',
      icon: 'home-outline',
    },
    {
      id: 2,
      title: '20% Off First Service',
      subtitle: 'New Customer',
      description: 'Limited time offer',
      color: '#EC4899',
      icon: 'gift-outline',
    },
    {
      id: 3,
      title: '24/7 Support Available',
      subtitle: 'Always Here',
      description: 'Fast response time',
      color: '#10B981',
      icon: 'headset-outline',
    },
  ];

  // Mock data for service categories
  const serviceCategories: ServiceCategory[] = [
    { id: 1, name: 'Cleaning', icon: 'water-outline', color: '#06B6D4' },
    { id: 2, name: 'Plumbing', icon: 'construct-outline', color: '#F59E0B' },
    { id: 3, name: 'Electrical', icon: 'flash-outline', color: '#EF4444' },
    { id: 4, name: 'Painting', icon: 'color-palette-outline', color: '#8B5CF6' },
    { id: 5, name: 'Carpentry', icon: 'hammer-outline', color: '#F97316' },
    { id: 6, name: 'AC Repair', icon: 'snow-outline', color: '#3B82F6' },
    { id: 7, name: 'Appliance', icon: 'tv-outline', color: '#EC4899' },
    { id: 8, name: 'Gardening', icon: 'leaf-outline', color: '#10B981' },
  ];

  // Mock data for featured services
  const featuredServices: FeaturedService[] = [
    {
      id: 1,
      name: 'Home Deep Cleaning',
      category: 'Cleaning',
      rating: 4.8,
      reviews: 1250,
      price: '150,000 VND',
      image: 'https://via.placeholder.com/300x200/007AFF/FFFFFF?text=Cleaning',
      discount: '20%',
    },
    {
      id: 2,
      name: 'Professional Plumbing',
      category: 'Plumbing',
      rating: 4.9,
      reviews: 890,
      price: '200,000 VND',
      image: 'https://via.placeholder.com/300x200/FF9500/FFFFFF?text=Plumbing',
    },
    {
      id: 3,
      name: 'Electrical Installation',
      category: 'Electrical',
      rating: 4.7,
      reviews: 560,
      price: '180,000 VND',
      image: 'https://via.placeholder.com/300x200/FF3B30/FFFFFF?text=Electrical',
      discount: '10%',
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = (): void => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderBanner = (): React.ReactElement => {
    const banner = banners[currentBannerIndex];
    return (
      <View style={[styles.banner, { backgroundColor: banner.color }]}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
            <Text style={styles.bannerTitle}>{banner.title}</Text>
            <Text style={styles.bannerDescription}>{banner.description}</Text>
          </View>
          <View style={styles.bannerIconContainer}>
            <Ionicons name={banner.icon} size={40} color="#FFFFFF" />
          </View>
        </View>
        <View style={styles.bannerIndicators}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentBannerIndex && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderCategoryItem = ({ item }: { item: ServiceCategory }): React.ReactElement => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => navigation.navigate('ServiceList', { category: item.name })}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryContainer, { backgroundColor: item.color + '15' }]}>
        <Ionicons name={item.icon} size={28} color={item.color} />
      </View>
      <Text style={styles.categoryLabel} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderFeaturedService = ({ item }: { item: FeaturedService }): React.ReactElement => {
    const serviceColor = item.image.includes('007AFF') ? '#007AFF' : 
                         item.image.includes('FF9500') ? '#FF9500' : '#FF3B30';
    
    return (
      <TouchableOpacity
        style={styles.serviceCard}
        onPress={() => navigation.navigate('ServiceDetail', { service: item })}
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
              <Ionicons name="star" size={16} color="#FFB800" />
              <Text style={styles.rating}>{item.rating}</Text>
              <Text style={styles.reviews}>({item.reviews})</Text>
            </View>
          </View>
          <Text style={styles.price}>{item.price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello{user ? `, ${user.fullName}` : ''}! 👋</Text>
          <Text style={styles.subGreeting}>What service do you need today?</Text>
        </View>
        {user ? (
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarButton}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#007AFF" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')} 
            style={styles.loginButton}
          >
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Promotional Banner */}
      {renderBanner()}

      {/* Service Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Categories</Text>
        <FlatList
          data={serviceCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={4}
          scrollEnabled={false}
          columnWrapperStyle={styles.categoryRow}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Camera')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="camera" size={24} color="#007AFF" />
            </View>
            <Text style={styles.quickActionText}>Scan Issue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('History')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="time" size={24} color="#34C759" />
            </View>
            <Text style={styles.quickActionText}>My Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Promotions')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FF950020' }]}>
              <Ionicons name="pricetag" size={24} color="#FF9500" />
            </View>
            <Text style={styles.quickActionText}>Promotions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Support')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#5856D620' }]}>
              <Ionicons name="headset" size={24} color="#5856D6" />
            </View>
            <Text style={styles.quickActionText}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllServices')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featuredServices}
          renderItem={renderFeaturedService}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Ionicons name="shield-checkmark" size={32} color="#34C759" />
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>Safe & Verified Professionals</Text>
          <Text style={styles.infoDescription}>
            All our service providers are background checked and verified
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  headerLeft: ViewStyle;
  greeting: TextStyle;
  subGreeting: TextStyle;
  avatarButton: ViewStyle;
  avatar: ViewStyle;
  loginButton: ViewStyle;
  loginButtonText: TextStyle;
  banner: ViewStyle;
  bannerContent: ViewStyle;
  bannerTextContainer: ViewStyle;
  bannerSubtitle: TextStyle;
  bannerTitle: TextStyle;
  bannerDescription: TextStyle;
  bannerIconContainer: ViewStyle;
  bannerIndicators: ViewStyle;
  indicator: ViewStyle;
  activeIndicator: ViewStyle;
  section: ViewStyle;
  sectionHeader: ViewStyle;
  sectionTitle: TextStyle;
  seeAll: TextStyle;
  categoryRow: ViewStyle;
  categoryItem: ViewStyle;
  categoryContainer: ViewStyle;
  categoryLabel: TextStyle;
  quickActions: ViewStyle;
  quickAction: ViewStyle;
  quickActionIcon: ViewStyle;
  quickActionText: TextStyle;
  featuredList: ViewStyle;
  serviceCard: ViewStyle;
  serviceImageContainer: ViewStyle;
  servicePlaceholder: ViewStyle;
  discountBadge: ViewStyle;
  discountText: TextStyle;
  discountLabel: TextStyle;
  serviceInfo: ViewStyle;
  serviceName: TextStyle;
  serviceCategory: TextStyle;
  serviceFooter: ViewStyle;
  ratingContainer: ViewStyle;
  rating: TextStyle;
  reviews: TextStyle;
  price: TextStyle;
  infoSection: ViewStyle;
  infoText: ViewStyle;
  infoTitle: TextStyle;
  infoDescription: TextStyle;
}

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Header - Clean & Minimal
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  subGreeting: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '400',
  },
  avatarButton: {
    marginLeft: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  // Banner - Minimalist
  banner: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    minHeight: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 26,
  },
  bannerDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '400',
  },
  bannerIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  bannerIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.4,
    marginHorizontal: 3,
  },
  activeIndicator: {
    opacity: 1,
    width: 20,
  },
  // Section
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  // Category - Clean Grid
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: (width - 60) / 4,
  },
  categoryContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Service Card - Professional
  featuredList: {
    paddingLeft: 20,
  },
  serviceCard: {
    width: 260,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceImageContainer: {
    position: 'relative',
  },
  servicePlaceholder: {
    width: '100%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  discountLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  serviceInfo: {
    padding: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 22,
  },
  serviceCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    fontWeight: '400',
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
    fontWeight: '400',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
  },
  // Info Section
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    marginTop: 8,
    marginBottom: 20,
    marginHorizontal: 20,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
    fontWeight: '400',
  },
});
