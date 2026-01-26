import { Ionicons } from '@expo/vector-icons';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useLayoutEffect, useMemo } from 'react';
import {
    Dimensions,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

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
  ServiceList: { category: string };
  ServiceDetail: { service: Service };
};

type ServiceListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ServiceList'>;
type ServiceListScreenRouteProp = RouteProp<RootStackParamList, 'ServiceList'>;

interface ServiceListScreenProps {
  navigation: ServiceListScreenNavigationProp;
  route: ServiceListScreenRouteProp;
}

export const ServiceListScreen: React.FC<ServiceListScreenProps> = ({ navigation, route }) => {
  const { category } = route.params;

  console.log('ServiceListScreen received category:', category);

  // Update navigation header title based on category
  useLayoutEffect(() => {
    navigation.setOptions({
      title: `${category} Services`,
    });
  }, [category, navigation]);

  // Mock data based on category - using useMemo to recalculate when category changes
  const services = useMemo(() => {
    const baseServices: Record<string, Service[]> = {
      Electronics: [
        {
          id: 1,
          name: 'Phone Screen Repair',
          category: 'Electronics',
          rating: 4.8,
          reviews: 320,
          price: '150,000 VND',
          description: 'Professional phone screen replacement service',
        },
        {
          id: 2,
          name: 'Laptop Hardware Repair',
          category: 'Electronics',
          rating: 4.7,
          reviews: 180,
          price: '250,000 VND',
          description: 'Expert laptop repair and maintenance',
        },
        {
          id: 3,
          name: 'Tablet Repair',
          category: 'Electronics',
          rating: 4.6,
          reviews: 95,
          price: '180,000 VND',
          description: 'Tablet repair and screen replacement',
        },
      ],
      Electrical: [
        {
          id: 4,
          name: 'Home Wiring Installation',
          category: 'Electrical',
          rating: 4.9,
          reviews: 450,
          price: '300,000 VND',
          description: 'Safe and reliable electrical wiring',
        },
        {
          id: 5,
          name: 'Circuit Breaker Repair',
          category: 'Electrical',
          rating: 4.8,
          reviews: 210,
          price: '200,000 VND',
          description: 'Circuit breaker installation and repair',
        },
        {
          id: 6,
          name: 'LED Lighting Installation',
          category: 'Electrical',
          rating: 4.7,
          reviews: 340,
          price: '150,000 VND',
          description: 'Modern LED lighting solutions',
        },
      ],
      Legal: [
        {
          id: 7,
          name: 'Contract Review',
          category: 'Legal',
          rating: 4.9,
          reviews: 280,
          price: '500,000 VND',
          description: 'Professional contract review and consultation',
        },
        {
          id: 8,
          name: 'Legal Consultation',
          category: 'Legal',
          rating: 4.8,
          reviews: 420,
          price: '400,000 VND',
          description: 'General legal advice and consultation',
        },
        {
          id: 9,
          name: 'Document Preparation',
          category: 'Legal',
          rating: 4.7,
          reviews: 190,
          price: '300,000 VND',
          description: 'Legal document drafting services',
        },
      ],
      'Real Estate': [
        {
          id: 10,
          name: 'Property Valuation',
          category: 'Real Estate',
          rating: 4.8,
          reviews: 340,
          price: '600,000 VND',
          description: 'Professional property appraisal',
        },
        {
          id: 11,
          name: 'Real Estate Consultation',
          category: 'Real Estate',
          rating: 4.9,
          reviews: 510,
          price: '450,000 VND',
          description: 'Expert advice on buying/selling property',
        },
        {
          id: 12,
          name: 'Land Survey',
          category: 'Real Estate',
          rating: 4.7,
          reviews: 220,
          price: '800,000 VND',
          description: 'Accurate land measurement and survey',
        },
      ],
    };

    console.log('Available categories:', Object.keys(baseServices));
    console.log('Looking for category:', category);
    console.log('Found services:', baseServices[category]?.length || 0);

    return baseServices[category] || [];
  }, [category]); // Re-run when category changes

  // Get icon based on category
  const getCategoryIcon = (categoryName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'Electronics': 'hardware-chip-outline',
      'Electrical': 'flash-outline',
      'Legal': 'document-text-outline',
      'Real Estate': 'home-outline',
    };
    return iconMap[categoryName] || 'construct-outline';
  };

  // Get color based on category
  const getCategoryColor = (categoryName: string): string => {
    const colorMap: Record<string, string> = {
      'Electronics': '#FF6B6B',  // Red
      'Electrical': '#FFB800',   // Yellow/Orange
      'Legal': '#0066CC',        // Blue
      'Real Estate': '#2ECC71',  // Green
    };
    return colorMap[categoryName] || '#0066CC';
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => navigation.navigate('ServiceDetail', { service: item })}
      activeOpacity={0.7}
    >
      <View style={styles.serviceIcon}>
        <Ionicons name={getCategoryIcon(item.category)} size={32} color={getCategoryColor(item.category)} />
      </View>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.serviceFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFB800" />
            <Text style={styles.rating}>{item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>
          <Text style={styles.price}>{item.price}</Text>
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
        <Text style={styles.headerTitle}>{category} Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  listContent: {
    padding: 16,
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
});
