import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { resolveGraphQLBaseUrl } from '../../config/api.config';

interface ServiceRequest {
  addressText: string;
  categoryId: string;
  complexity: { level: number };
  createdAt: string;
  customerId: string;
  description?: string;
  estimatedCost?: { amount: number; currency: string };
  id: string;
  status: string;
}

interface GraphQLResponse {
  data?: {
    getServiceRequests: ServiceRequest[];
  };
  errors?: Array<{ message: string }>;
}

const fetchServiceRequests = async (): Promise<ServiceRequest[]> => {
  const token = await AsyncStorage.getItem('authToken');
  const graphqlUrl = await resolveGraphQLBaseUrl();

  console.log('TOKEN:', token);
  console.log('GRAPHQL URL:', graphqlUrl);

  if (!token) {
    throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
  }

  try {
    const response = await axios.post<GraphQLResponse>(
      graphqlUrl,
      {
        query: `
          query GetServiceRequests {
            getServiceRequests {
              addressText
              categoryId
              complexity { level }
              createdAt
              customerId
              description
              estimatedCost {
                amount
                currency
              }
              id
              status
            }
          }
        `,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      }
    );

    console.log('GRAPHQL RESPONSE:', JSON.stringify(response.data, null, 2));

    if (response.data.errors && response.data.errors.length > 0) {
      throw new Error(response.data.errors.map(e => e.message).join(', '));
    }

    return response.data.data?.getServiceRequests ?? [];
  } catch (error: any) {
    console.log('FETCH ERROR FULL:', error?.response?.data || error.message);
    throw new Error(
      error?.response?.data?.errors?.[0]?.message ||
      error.message ||
      'Lỗi không xác định'
    );
  }
};

export const AvailableJobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const requests = await fetchServiceRequests();
      setServiceRequests(requests);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  const renderJobItem = ({ item }: { item: ServiceRequest }) => (
    <TouchableOpacity
      style={styles.jobCard}
      onPress={() => navigation.navigate('JobTabs', { job: item })}
    >
      <View style={styles.avatarContainer}>
        <Ionicons name="person-circle-outline" size={50} color="#333" />
      </View>

      <View style={styles.jobInfo}>
        <Text style={styles.jobType}>
          {item.description || item.categoryId || 'Không có mô tả'}
        </Text>

        <Text style={styles.jobDetail}>
          Độ khó:{' '}
          <Text style={styles.boldText}>
            {item.complexity?.level ?? 'Chưa xác định'}
          </Text>
        </Text>

        <Text style={styles.jobDetail}>
          Địa chỉ:{' '}
          <Text style={styles.boldText}>
            {item.addressText || 'Chưa có'}
          </Text>
        </Text>

        <Text style={styles.jobDetail}>
          Trạng thái:{' '}
          <Text style={styles.boldText}>{item.status}</Text>
        </Text>

        <Text style={styles.jobDetail}>
          Giá ước tính:{' '}
          <Text style={styles.boldText}>
            {item.estimatedCost
              ? `${item.estimatedCost.amount} ${item.estimatedCost.currency}`
              : 'Chưa có'}
          </Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  const FilterButton = ({ title }: { title: string }) => (
    <TouchableOpacity style={styles.filterButton}>
      <Text style={styles.filterText}>{title}</Text>
      <Ionicons name="chevron-down" size={16} color="#333" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          Đang tải danh sách đơn hàng...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Danh sách đơn hàng treo</Text>
      </View>

      <View style={styles.filterBar}>
        <FilterButton title="Nghiệp vụ" />
        <FilterButton title="Độ khó" />
        <FilterButton title="Địa chỉ" />
      </View>

      <FlatList
        data={serviceRequests}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={initData}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {error
                ? 'Lỗi tải dữ liệu. Kéo xuống để thử lại.'
                : 'Không có đơn hàng nào'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 10, fontSize: 16, color: '#666' },
  emptyText: { fontSize: 16, color: '#999', textAlign: 'center' },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#999' },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
    fontWeight: '500',
  },
  listContent: { padding: 16 },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
  },
  avatarContainer: { justifyContent: 'center', marginRight: 12 },
  jobInfo: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
  },
  jobType: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  jobDetail: { fontSize: 13, marginBottom: 2 },
  boldText: { fontWeight: '600' },
});