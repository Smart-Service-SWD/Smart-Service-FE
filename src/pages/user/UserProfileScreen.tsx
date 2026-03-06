import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUserProfile } from '../../features/user/profile/model/useUserProfile';
import { styles } from './user-profile/styles';

export const UserProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    profileUser,
    loading,
    error,
    editModalVisible,
    editFullName,
    editPhone,
    editSaving,
    getAvatarColor,
    getInitial,
    setEditFullName,
    setEditPhone,
    loadProfileData,
    logoutWithConfirm,
    openEditModal,
    closeEditModal,
    handleSaveProfile,
  } = useUserProfile();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Đang tải thông tin...</Text>
      </View>
    );
  }

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
        </View>

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <TouchableOpacity style={styles.actionItem} onPress={openEditModal}>
            <Ionicons name="create-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Chỉnh sửa hồ sơ</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionItem, styles.logoutItem]} onPress={logoutWithConfirm}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={[styles.actionText, styles.logoutText]}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEditModal}
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
                onPress={closeEditModal}
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
