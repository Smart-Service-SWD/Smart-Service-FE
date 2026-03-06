import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { adminGraphqlService, ServiceListItem } from '../../services/adminGraphqlService';

type RootStackParamList = {
  ServiceList: { category: string; categoryId?: string };
  ServiceDetail: { service: ServiceListItem };
};

type ServiceListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceList'>;
type ServiceListScreenRouteProp = RouteProp<RootStackParamList, 'ServiceList'>;

interface ServiceListScreenProps {
  navigation: ServiceListScreenNavigationProp;
  route: ServiceListScreenRouteProp;
}

export const ServiceListScreen: React.FC<ServiceListScreenProps> = ({ navigation, route }) => {
  const { category, categoryId } = route.params;
  const [services, setServices] = useState<ServiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Update navigation header title
  useLayoutEffect(() => {
    navigation.setOptions({
      title: category || 'Services',
    });
  }, [category, navigation]);

  const fetchServices = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      if (categoryId) {
        const byCategory = await adminGraphqlService.getServiceDefinitionsByCategory(categoryId);
        setServices(byCategory);
      } else {
        const allServices = await adminGraphqlService.getServiceDefinitions();
        const filtered = category === 'Tất cả'
          ? allServices
          : allServices.filter(s => s.categoryName === category);
        setServices(filtered);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, categoryId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices(true);
  };

  const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'Electronics': 'hardware-chip-outline',
      'Electrical': 'flash-outline',
      'Legal': 'document-text-outline',
      'Real Estate': 'home-outline',
    };
    return iconMap[categoryName] || 'construct-outline';
  };

  const getCategoryColor = (categoryName: string): string => {
    const colorMap: Record<string, string> = {
      'Electronics': '#FF6B6B',
      'Electrical': '#FFB800',
      'Legal': '#0066CC',
      'Real Estate': '#2ECC71',
    };
    return colorMap[categoryName] || '#0066CC';
  };

  const renderServiceItem = ({ item }: { item: ServiceListItem }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => navigation.navigate('ServiceDetail', { service: item })}
      activeOpacity={0.7}
    >
      <View style={styles.serviceIcon}>
        <Ionicons name={getCategoryIcon(item.categoryName)} size={32} color={getCategoryColor(item.categoryName)} />
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#0066CC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066CC" />
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066CC" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="construct-outline" size={64} color="#CCC" />
              <Text style={styles.emptyText}>No services found in this category</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0066CC',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
});
