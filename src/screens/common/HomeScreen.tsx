import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { ToastService } from '../../components/toast';
import { useAuth } from '../../context/AuthContext';
import * as userService from '../../services/userService';
import { adminGraphqlService } from '../../services/adminGraphqlService';

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
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

interface FeaturedService {
  id: string;
  name: string;
  category: string;
  reviews: number;
  price: string;
  discount?: string;
}

type RootStackParamList = {
  HomeMain: undefined;
  ServiceList: { category: string; categoryId?: string };
  ServiceDetail: { service: FeaturedService };
  Profile: undefined;
  CreateRequest: { service: FeaturedService };
  GraphQLDemo: undefined;
  NewRequest: undefined;
  MyRequests: undefined;
};

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HomeMain'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const BANNERS: Banner[] = [
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

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);

  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);

  const fetchHomeData = async () => {
    try {
      const categories = await userService.getServiceCategories();
      setServiceCategories(categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        icon: 'construct-outline', // Default icon
        color: '#4F46E5'
      })));

      const services = await adminGraphqlService.getServiceDefinitions();
      setFeaturedServices(services.slice(0, 5).map((s: any) => ({
        id: s.id,
        name: s.name,
        category: s.categoryName,
        reviews: s.bookingCount || 0,
        price: `${s.basePrice} VND`,
      })));
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  };

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchHomeData();
    setRefreshing(false);
  };

  const renderBanner = (): React.ReactElement => {
    const banner = BANNERS[currentBannerIndex];
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
          {BANNERS.map((_, index) => (
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

  const renderCategoryItem = ({ item }: { item: ServiceCategory }): React.ReactElement => {
    const handlePress = () => {
      console.log('Category item clicked:', item.name);
      navigation.navigate('ServiceList', { category: item.name, categoryId: item.id });
    };

    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={[styles.categoryContainer, { backgroundColor: item.color + '15' }]}>
          <Ionicons name={item.icon} size={28} color={item.color} />
        </View>
        <View style={{ height: 8 }} />
        <Text style={styles.categoryLabel} numberOfLines={1}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderFeaturedService = ({ item }: { item: FeaturedService }): React.ReactElement => {
    const colorMap: Record<string, string> = {
      Electronics: '#06B6D4',
      Electrical: '#EF4444',
      Legal: '#8B5CF6',
      'Real Estate': '#10B981',
    };
    const serviceColor = colorMap[item.category] ?? '#007AFF';

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
              <Ionicons name="document-text-outline" size={16} color="#6B7280" />
              <Text style={styles.reviews}>{item.reviews} lượt đặt</Text>
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
          <>
            <TouchableOpacity onPress={() => setMenuVisible((v) => !v)} style={styles.avatarButton}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={24} color="#007AFF" />
              </View>
            </TouchableOpacity>
            {menuVisible && (
              <>
                <TouchableOpacity style={styles.menuOverlay} onPress={() => setMenuVisible(false)} />
                <View style={styles.dropdownMenu}>
                  <Text style={styles.menuName}>{user.fullName}</Text>
                  <Text style={styles.menuRole}>{user.role || 'User'}</Text>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuVisible(false);
                      navigation.navigate('Profile');
                    }}
                  >
                    <Ionicons name="person-circle-outline" size={18} color="#333" />
                    <Text style={styles.menuItemText}>View Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={() => {
                      setMenuVisible(false);
                      logout();
                    }}
                  >
                    <Ionicons name="log-out-outline" size={18} color="#E53935" />
                    <Text style={[styles.menuItemText, { color: '#E53935' }]}>Logout</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
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

      {/* GraphQL Demo & Toast Test */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 12 }}>
        <TouchableOpacity
          style={[styles.graphqlDemoCard, { flex: 1, marginHorizontal: 0, marginTop: 0 }]}
          onPress={() => navigation.navigate('GraphQLDemo')}
          activeOpacity={0.8}
        >
          <Ionicons name="code-slash" size={20} color="#007AFF" />
          <Text style={[styles.graphqlDemoText, { fontSize: 13 }]}>GraphQL</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.graphqlDemoCard, { flex: 1, marginHorizontal: 0, marginTop: 0, borderColor: '#10B981' }]}
          onPress={() => {
            ToastService.show({
              type: 'success',
              title: 'Thành công!',
              message: 'Toast custom hoạt động mượt mà.',
              duration: 3000
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={20} color="#10B981" />
          <Text style={[styles.graphqlDemoText, { fontSize: 13, color: '#10B981' }]}>Test Toast</Text>
        </TouchableOpacity>
      </View>


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
            onPress={() => navigation.navigate('NewRequest')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#007AFF20' }]}>
              <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            </View>
            <View style={{ height: 8 }} />
            <Text style={styles.quickActionText}>Tạo yêu cầu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MyRequests')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#34C75920' }]}>
              <Ionicons name="clipboard-outline" size={24} color="#34C759" />
            </View>
            <View style={{ height: 8 }} />
            <Text style={styles.quickActionText}>Yêu cầu của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('GraphQLDemo')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FF950020' }]}>
              <Ionicons name="sparkles-outline" size={24} color="#FF9500" />
            </View>
            <View style={{ height: 8 }} />
            <Text style={styles.quickActionText}>Danh mục dịch vụ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Profile')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#5856D620' }]}>
              <Ionicons name="person-outline" size={24} color="#5856D6" />
            </View>
            <View style={{ height: 8 }} />
            <Text style={styles.quickActionText}>Tài khoản</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Services */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ServiceList', { category: 'Tất cả' })}>
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
  // Dropdown menu styles
  menuOverlay: ViewStyle;
  dropdownMenu: ViewStyle;
  menuName: TextStyle;
  menuRole: TextStyle;
  menuDivider: ViewStyle;
  menuItem: ViewStyle;
  menuItemText: TextStyle;
  logoutItem: ViewStyle;
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
  graphqlDemoCard: ViewStyle;
  graphqlDemoText: TextStyle;
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
  // Dropdown menu styles
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 86,
    right: 20,
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 999,
  },
  menuName: { fontWeight: '700', color: '#111827', marginBottom: 2 },
  menuRole: { color: '#6B7280', fontSize: 12, marginBottom: 8 },
  menuDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 6 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  menuItemText: { marginLeft: 8, color: '#111827' },
  logoutItem: { marginTop: 6 },
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
  graphqlDemoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  graphqlDemoText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
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
    paddingVertical: 8,
  },
  categoryContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 0,
    paddingHorizontal: 4,
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  quickActionText: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 0,
    paddingHorizontal: 4,
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
