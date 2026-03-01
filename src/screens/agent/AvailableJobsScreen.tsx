import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
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
  attachments: { id: string; url: string; name: string }[];
  categoryId: string;
  complexity: string;
  createdAt: string;
  customerId: string;
  description?: string;
  estimatedCost?: { amount: number; currency: string };
  id: string;
  status: string;
}

interface GraphQLResponse {
  data: { 
    getServiceRequests: ServiceRequest[] 
  };
  errors?: Array<{ message: string }>;
}
const fetchServiceRequests = async (): Promise<ServiceRequest[]> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const graphqlUrl = await resolveGraphQLBaseUrl(); // ✅ Thay localhost
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: `
          query GetServiceRequests {
            getServiceRequests {
              addressText
              attachments {
                id
                url
                name
              }
              categoryId
              complexity
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
      }),
    });

    const result: GraphQLResponse = await response.json();

    if (result.errors) {
      throw new Error(result.errors.map((e: any) => e.message).join(', '));
    }

    return result.data.getServiceRequests || [];
  } catch (error) {
    throw new Error(`Lỗi API: ${error}. Kiểm tra BE chạy cổng 5268.`);
  }
};


export const AvailableJobsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
  try {
    setLoading(true);
    const requests = await fetchServiceRequests();
    setServiceRequests(requests);
  } catch (err: any) {
    setError(err.message || 'Lỗi khi tải dữ liệu');
    Alert.alert('Lỗi', err.message || 'Không thể tải danh sách đơn hàng');
  } finally {
    setLoading(false);
  }
};


  const renderJobItem = ({ item }: { item: any }) => (
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
          Độ khó: <Text style={styles.boldText}>{item.complexity || 'Chưa xác định'}</Text>
        </Text>
        <Text style={styles.jobDetail}>
          Địa chỉ: <Text style={styles.boldText}>{item.addressText || 'Chưa có'}</Text>
        </Text>
        <Text style={styles.jobDetail}>
          Trạng thái: <Text style={styles.boldText}>{item.status}</Text>
        </Text>
        <Text style={styles.jobDetail}>
          Giá ước tính: <Text style={styles.boldText}>{item.estimatedCost?.amount} {item.estimatedCost?.currency}</Text>
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
        <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>List đơn hàng treo</Text>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <FilterButton title="Nghiệp vụ" />
        <FilterButton title="Độ khó" />
        <FilterButton title="Địa chỉ" />
      </View>

      {/* Job List */}
      <FlatList
        data={serviceRequests}
        renderItem={renderJobItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>
              {error ? 'Lỗi tải dữ liệu. Kéo xuống để thử lại.' : 'Không có đơn hàng nào'}
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={initData}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  filterText: {
    fontSize: 14,
    color: '#333',
    marginRight: 5,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    justifyContent: 'center',
    marginRight: 12,
  },
  jobInfo: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 4,
  },
  jobType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  jobDetail: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  boldText: {
    fontWeight: '600',
  },
});
