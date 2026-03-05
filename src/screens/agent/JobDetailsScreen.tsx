import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { resolveGraphQLBaseUrl } from '../../config/api.config';


interface ServiceAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: string;
}

interface ServiceRequest {
  id: string;
  description: string;
  attachments: ServiceAttachment[];
}

interface ServiceRequestResponse {
  data: {
    getServiceRequestById: ServiceRequest;
  };
  errors?: Array<{ message: string }>;
}

const fetchServiceRequestById = async (id: string): Promise<ServiceRequest> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const graphqlUrl = await resolveGraphQLBaseUrl();
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: `
          query getServiceRequestById($id: UUID!) {
            getServiceRequestById(id: $id) {
              id
              description
              attachments {
                id
                fileName
                fileUrl
                type
                uploadedAt
              }
            }
          }
        `,
        variables: { id }
      }),
    });

    const result: ServiceRequestResponse = await response.json();

    if (result.errors) {
      throw new Error(result.errors.map((e: any) => e.message).join(', '));
    }

    return result.data.getServiceRequestById;
  } catch (error) {
    throw new Error(`Lỗi API: ${error}`);
  }
};


export const JobDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  console.log("Route params:", route.params);
  const jobId = route.params?.job?.id;

  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
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
      const data = await fetchServiceRequestById(jobId);
      setServiceRequest(data);
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

  const goToOverview = () => {
    navigation.navigate('Overview');
  };

  const goBackToJobs = () => {
    navigation.getParent()?.goBack();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
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

  return (
    <View style={styles.container}>
      {/* Header + Tab Indicator */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBackToJobs}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.tabContainer}>
          <TouchableOpacity style={styles.tabItem} onPress={goToOverview}>
            <Text style={styles.inactiveTab}>TỔNG QUAN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Text style={styles.activeTab}>CHI TIẾT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Mô tả chi tiết */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mô tả chi tiết</Text>
          <Text style={styles.detailText}>{serviceRequest.description}</Text>
        </View>

        {/* File đính kèm */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>File đính kèm ({serviceRequest.attachments.length})</Text>
          {serviceRequest.attachments.map((attachment) => (
            <TouchableOpacity key={attachment.id} style={styles.fileItem}>
              <Ionicons 
                name={attachment.type === 'IMAGE' ? "image-outline" : "videocam-outline"} 
                size={20} 
                color="#007AFF" 
              />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{attachment.fileName}</Text>
                <Text style={styles.fileType}>
                  {attachment.type} • {new Date(attachment.uploadedAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
              <Ionicons name="download-outline" size={20} color="#666" />
            </TouchableOpacity>
          ))}
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
    backgroundColor: '#F8F9FA'
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
    marginRight: 15
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
  scrollView: {
    flex: 1,
    padding: 20
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16
  },
  detailText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    paddingVertical: 8
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    justifyContent: 'space-between',
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  fileType: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
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
    letterSpacing: 1
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
    letterSpacing: 1
  },
  // Styles cho loading/error
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 20,
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

export default JobDetailsScreen;
