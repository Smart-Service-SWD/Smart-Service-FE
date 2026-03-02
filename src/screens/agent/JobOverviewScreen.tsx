import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { resolveGraphQLBaseUrl } from '../../config/api.config';


interface ServiceRequest {
  id: string;
  addressText: string;
  categoryId: string;
  complexity: string;
  customerId: string;
  estimatedCost?: {
    amount: number;
    currency: string;
  };
  status: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface ServiceCategory {
  id: string;
  name: string;
}

interface ServiceRequestResponse {
  data: {
    getServiceRequestById: ServiceRequest;
  };
  errors?: Array<{ message: string }>;
}

interface UserResponse {
  data: {
    getUserById: User;
  };
  errors?: Array<{ message: string }>;
}

interface CategoryResponse {
  data: {
    getServiceCategoryById: ServiceCategory;
  };
  errors?: Array<{ message: string }>;
}

const fetchServiceRequestById = async (id: string): Promise<ServiceRequest> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const graphqlUrl = await resolveGraphQLBaseUrl(); // ✅ THÊM
    
    const response = await fetch(graphqlUrl, { // ✅ THAY localhost
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: `
          query getServiceRequestById($id: UUID!) {
            getServiceRequestById(id: $id) {
              id addressText categoryId complexity customerId
              estimatedCost { amount currency } status
            }
          }
        `,
        variables: { id }
      }),
    });

    const result: ServiceRequestResponse = await response.json();
    if (result.errors) throw new Error(result.errors.map((e: any) => e.message).join(', '));
    return result.data.getServiceRequestById;
  } catch (error) {
    throw new Error(`Lỗi API: ${error}`);
  }
};


const fetchUserById = async (id: string): Promise<User> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const graphqlUrl = await resolveGraphQLBaseUrl(); // ✅ THÊM
    
    const response = await fetch(graphqlUrl, { // ✅ THAY localhost
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: `
          query getUserById($id: UUID!) {
            getUserById(id: $id) {
              id fullName email phoneNumber
            }
          }
        `,
        variables: { id }
      }),
    });

    const result: UserResponse = await response.json();
    if (result.errors) throw new Error(result.errors.map((e: any) => e.message).join(', '));
    return result.data.getUserById;
  } catch (error) {
    throw new Error(`Lỗi API: ${error}`);
  }
};

const fetchServiceCategoryById = async (id: string): Promise<ServiceCategory> => {
  try {
    const graphqlUrl = await resolveGraphQLBaseUrl(); // ✅ THÊM
    
    const response = await fetch(graphqlUrl, { // ✅ THAY localhost
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query getServiceCategoryById($id: UUID!) {
            getServiceCategoryById(id: $id) {
              id name
            }
          }
        `,
        variables: { id }
      }),
    });

    const result: CategoryResponse = await response.json();
    if (result.errors) throw new Error(result.errors.map((e: any) => e.message).join(', '));
    return result.data.getServiceCategoryById;
  } catch (error) {
    throw new Error(`Lỗi API: ${error}`);
  }
};


export const JobOverviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { jobId } = route.params || {};

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobData = async () => {
    if (!jobId) {
      setError('Không có ID công việc');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 1. Lấy ServiceRequest trước
      const requestData = await fetchServiceRequestById(jobId);
      setServiceRequest(requestData);

      // 2. Lấy Customer info
      const customerData = await fetchUserById(requestData.customerId);
      setCustomer(customerData);

      // 3. Lấy Category info
      const categoryData = await fetchServiceCategoryById(requestData.categoryId);
      setCategory(categoryData);

    } catch (err: any) {
      setError(err.message);
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  const handleAccept = () => {
    Alert.alert('Thành công', 'Bạn đã nhận đơn hàng này!', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
  };

  const handleDeny = () => {
    Alert.alert('Hủy', 'Bạn có chắc muốn từ chối đơn này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Có', onPress: () => navigation.goBack() }
    ]);
  };

  const goToDetails = () => {
    navigation.navigate('Details');
  };

  const goBackToJobs = () => {
    navigation.getParent()?.goBack();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Đang tải thông tin công việc...</Text>
      </View>
    );
  }

  if (error || !serviceRequest) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || 'Không có dữ liệu'}</Text>
        <TouchableOpacity onPress={fetchJobData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatPrice = () => {
    if (!serviceRequest.estimatedCost) return 'Chưa xác định';
    return `${serviceRequest.estimatedCost.amount.toLocaleString()} ${serviceRequest.estimatedCost.currency}`;
  };

  const getComplexityIcon = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'easy': return '😊';
      case 'medium': return '😐';
      case 'hard': return '😤';
      default: return '⚠️';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header + Tab Indicator */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBackToJobs}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={styles.activeTab}>TỔNG QUAN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={goToDetails}>
            <Text style={styles.inactiveTab}>CHI TIẾT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Customer Card */}
        <View style={styles.card}>
          <View style={styles.customerRow}>
            <Image 
              source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} 
              style={styles.avatar} 
            />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{customer?.fullName || 'N/A'}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.address} numberOfLines={1}>{serviceRequest.addressText}</Text>
              </View>
              <Text style={styles.customerDetail}>📧 {customer?.email || 'N/A'}</Text>
              <Text style={styles.customerDetail}>📱 {customer?.phoneNumber || 'N/A'}</Text>
            </View>
            <Ionicons name="chatbubble-outline" size={20} color="#007AFF" />
          </View>
        </View>

        {/* Job Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin công việc</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="hammer-outline" size={20} color="#007AFF" />
              <Text style={styles.infoLabel}>Loại dịch vụ</Text>
            </View>
            <Text style={styles.infoValue}>{category?.name || 'N/A'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="flame-outline" size={20} color="#FF6B35" />
              <Text style={styles.infoLabel}>Độ khó</Text>
            </View>
            <Text style={styles.infoValue}>
              {serviceRequest.complexity} {getComplexityIcon(serviceRequest.complexity)}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#14A800" />
              <Text style={styles.infoLabel}>Trạng thái</Text>
            </View>
            <Text style={styles.infoValue}>{serviceRequest.status}</Text>
          </View>
        </View>

        {/* Price Card */}
        <View style={[styles.card, styles.priceCard]}>
          <Text style={styles.priceLabel}>Giá nhận việc</Text>
          <Text style={styles.price}>{formatPrice()}</Text>
          <Text style={styles.paymentText}>Thanh toán khi hoàn thành</Text>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
        <Text style={styles.acceptButtonText}>NHẬN VIỆC NGAY</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.denyButton} onPress={handleDeny}>
        <Text style={styles.denyButtonText}>Từ chối</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  customerDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 8,
  },
  priceCard: {
    backgroundColor: '#6BCB8D',
    borderWidth: 1,
    borderColor: '#22B154',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#141414',
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 14,
    color: '#D32F2F',
  },
  acceptButton: {
    backgroundColor: '#14A800',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 100,
    marginBottom: 12,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  acceptButtonText: {
    color: '#14120B',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  denyButton: {
    backgroundColor: '#E10608',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 100,
    marginBottom: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  denyButtonText: {
    color: '#14120B',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  activeTab: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  inactiveTab: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default JobOverviewScreen;
