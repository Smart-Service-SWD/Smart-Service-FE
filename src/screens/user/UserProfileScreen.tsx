import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { resolveGraphQLBaseUrl } from '../../config/api.config';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/userService';

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
  const { user: authUser, logout, updateProfile: updateAuthProfile } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // ✅ GraphQL Query
  const fetchUserProfile = async (userId: string): Promise<User> => {
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

  const openEditModal = () => {
    setEditFullName(profileUser?.fullName ?? '');
    setEditPhone(profileUser?.phoneNumber ?? '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }
    setEditSaving(true);
    try {
      await updateProfile({ fullName: editFullName.trim(), phoneNumber: editPhone.trim() });
      setProfileUser(prev => prev ? { ...prev, fullName: editFullName.trim(), phoneNumber: editPhone.trim() } : prev);
      await updateAuthProfile({ fullName: editFullName.trim(), phoneNumber: editPhone.trim() });
      setEditModalVisible(false);
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message ?? err?.message ?? 'Không thể cập nhật hồ sơ');
    } finally {
      setEditSaving(false);
    }
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

        {/* Yêu cầu dịch vụ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dịch vụ</Text>
          <TouchableOpacity style={styles.actionItem} onPress={() => navigation.navigate('MyRequests')}>
            <Ionicons name="list-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Yêu cầu của tôi</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionItem, styles.logoutItem]} onPress={() => navigation.navigate('NewRequest')}>
            <Ionicons name="add-circle-outline" size={20} color="#10B981" />
            <Text style={[styles.actionText, { color: '#10B981' }]}>Tạo yêu cầu mới</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Tài khoản */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <TouchableOpacity style={styles.actionItem} onPress={openEditModal}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Chỉnh sửa hồ sơ</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionItem, styles.logoutItem]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.logoutText]}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
            <Text style={styles.modalLabel}>Họ và tên</Text>
            <TextInput
              style={styles.modalInput}
              value={editFullName}
              onChangeText={setEditFullName}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#9CA3AF"
            />
            <Text style={styles.modalLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setEditModalVisible(false)}
                disabled={editSaving}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnSave, editSaving && { opacity: 0.6 }]}
                onPress={handleSaveProfile}
                disabled={editSaving}
              >
                {editSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnSaveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 },
  modalLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    marginBottom: 16,
  },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalBtnCancelText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  modalBtnSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  modalBtnSaveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
