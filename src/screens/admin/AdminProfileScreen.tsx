import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { adminGraphqlService } from '../../services/adminGraphqlService';
import { adminRestService } from '../../services/adminRestService';

export const AdminProfileScreen: React.FC<{ navigation }> = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const openEdit = () => {
    setEditName(user?.fullName || '');
    setEditPhone(user?.phoneNumber || '');
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }
    setSaving(true);
    try {
      await adminRestService.updateProfile(editName.trim(), editPhone.trim());
      await updateProfile({
        fullName: editName.trim(),
        email: user?.email || '',
        phoneNumber: editPhone.trim() || undefined,
        role: user?.role as any,
      });
      setEditVisible(false);
      Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await adminGraphqlService.getCurrentUser();
        if (profile) {
          await updateProfile({
            fullName: profile.fullName,
            email: profile.email,
            phoneNumber: profile.phoneNumber || undefined,
            role: profile.role === 'CUSTOMER' ? 'USER' : (profile.role as any),
          });
        }
      } catch (error) {
        Alert.alert('Lỗi', (error as Error).message || 'Không thể tải hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [updateProfile]);

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

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatarContainer, { backgroundColor: '#FF3B30' }]}>
          <Ionicons name="shield-checkmark" size={50} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.fullName || 'Administrator'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: '#FF3B30' }]}>
          <Text style={styles.roleText}>Quản trị viên</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>Đang tải hồ sơ...</Text>
          </View>
        ) : (
          <>
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
                <Text style={styles.infoValue}>Quản trị viên hệ thống</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quản lý Admin</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="people-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Quản lý Admin khác</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="document-text-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Nhật ký hoạt động</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => Alert.alert('Thông báo', 'Chức năng đang phát triển')}
        >
          <Ionicons name="key-outline" size={20} color="#007AFF" />
          <Text style={styles.actionText}>Quyền truy cập</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cài đặt</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={openEdit}
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

      {/* Edit Profile Modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>

              <Text style={styles.fieldLabel}>Họ và tên *</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập họ và tên"
                placeholderTextColor="#aaa"
              />

              <Text style={styles.fieldLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setEditVisible(false)} disabled={saving}>
                  <Text style={styles.btnCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnSave, saving && { opacity: 0.6 }]} onPress={handleSaveProfile} disabled={saving}>
                  {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSaveText}>Lưu</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  btnCancelText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  btnSave: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  btnSaveText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '700',
  },
});
