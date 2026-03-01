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
  View,
} from 'react-native';
import { resolveGraphQLBaseUrl } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';

// ✅ Types
interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

interface UserResponse {
  data: { getUserById: User };
  errors?: Array<{ message: string }>;
}

export const UserProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ✅ GraphQL Query
  const fetchUserProfile = async (userId: string): Promise<User> => {
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
              id fullName email phoneNumber role
            }
          }
        `,
        variables: { id: userId },
      }),
    });

    const result: UserResponse = await response.json();
    if (result.errors) throw new Error(result.errors.map((e: any) => e.message).join(', '));
    return result.data.getUserById;
  };

  // ✅ Load data
  const loadProfileData = async () => {
    if (!authUser?.id) {
      setError('Không tìm thấy thông tin đăng nhập');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const userData = await fetchUserProfile(authUser.id);
      setProfileUser(userData);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Lỗi', err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Dynamic avatar
  const getAvatarColor = (name: string) => {
    if (!name) return '#ccc';
    const charCode = name.charAt(0).toUpperCase().charCodeAt(0);
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#F8C471'];
    return colors[charCode % colors.length];
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  useEffect(() => {
    loadProfileData();
  }, [authUser?.id]);

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  // ✅ Loading
  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

  // ✅ Error
  if (error || !profileUser) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || 'Không tải được dữ liệu'}</Text>
        <TouchableOpacity onPress={loadProfileData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ✅ HEADER với Dynamic Avatar */}
        <View style={styles.header}>
          <View style={[styles.avatarContainer, { backgroundColor: getAvatarColor(profileUser.fullName) }]}>
            <Text style={styles.avatarInitial}>{getInitial(profileUser.fullName)}</Text>
          </View>
          <Text style={styles.name}>{profileUser.fullName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profileUser.role === 'AGENT' ? 'Nhà cung cấp dịch vụ' : 'Khách hàng'}
            </Text>
          </View>
        </View>

        {/* ✅ THÔNG TIN từ Query */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin liên hệ</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Số điện thoại</Text>
              <Text style={styles.infoValue}>{profileUser.phoneNumber || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="mail-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profileUser.email || 'Chưa cập nhật'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Địa chỉ</Text>
              <Text style={styles.infoValue}>Hồ Chí Minh, Việt Nam</Text>
            </View>
          </View>
        </View>

        {/* Các sections khác giữ nguyên */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bài đánh giá</Text>
          <View style={styles.placeholderContainer}>
            <Ionicons name="chatbubbles-outline" size={40} color="#ccc" />
            <Text style={styles.placeholderText}>Chưa có bài đánh giá nào</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt tài khoản</Text>
          <TouchableOpacity style={styles.actionItem} onPress={() => {}}>
            <Ionicons name="settings-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Cài đặt chung</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionItem, styles.logoutItem]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.logoutText]}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

// ✅ TẤT CẢ STYLES (copy từ code gốc + thêm mới)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 80,
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
  avatarInitial: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: '#007AFF',
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
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
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
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 16,
    borderRadius: 8,
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
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
