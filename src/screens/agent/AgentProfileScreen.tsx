import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { resolveGraphQLBaseUrl } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';


interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface UserResponse {
  data: {
    getUserById: User;
  };
  errors?: Array<{ message: string }>;
}

const fetchUserById = async (id: string): Promise<User> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const graphqlUrl = await resolveGraphQLBaseUrl();
    
    const response = await fetch(graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        query: `
          query getUserById($id: UUID!) {
            getUserById(id: $id) {
              id
              fullName
              email
              phoneNumber
            }
          }
        `,
        variables: { id }
      }),
    });

    const result: UserResponse = await response.json();

    if (result.errors) {
      throw new Error(result.errors.map((e: any) => e.message).join(', '));
    }

    return result.data.getUserById;
  } catch (error) {
    throw new Error(`Lỗi kết nối API: ${error}. Kiểm tra BE chạy cổng 5268.`);
  }
};

export const AgentProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserData = async () => {
    if (!authUser?.id) {
      setError('Không tìm thấy thông tin người dùng');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const userData = await fetchUserById(authUser.id);
      setUser(userData);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [authUser?.id]);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: () => logout()
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchUserData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { backgroundColor: '#34C759' }]}>
          <Ionicons name="construct" size={50} color="#fff" />
        </View> 
        <Text style={styles.name}>{user?.fullName || 'Service Provider'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: '#34C759' }]}>
          <Text style={styles.roleText}>Nhà cung cấp dịch vụ</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
        
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Số điện thoại</Text>
            <Text style={styles.infoValue}>{user?.phoneNumber || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Vai trò</Text>
            <Text style={styles.infoValue}>Đại lý cung cấp dịch vụ</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Ionicons name="business-outline" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Tên doanh nghiệp</Text>
            <Text style={styles.infoValue}>Chưa cập nhật</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quản lý dịch vụ</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="build-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Năng lực của tôi</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="list-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Công việc được giao</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="time-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Lịch sử dịch vụ</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="star-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Đánh giá của khách hàng</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thu nhập</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="wallet-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Thu nhập & Thanh toán</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="stats-chart-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Thống kê doanh thu</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Chỉnh sửa thông tin</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="lock-closed-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Đổi mật khẩu</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="notifications-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Thông báo</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionText, styles.logoutText]}>Đăng xuất</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#FF3B30',
  },
  // Thêm styles cho loading/error
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

export default AgentProfileScreen;
