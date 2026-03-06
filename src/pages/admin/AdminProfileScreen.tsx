import React from 'react';
import {
  ScrollView,
  Alert,
} from 'react-native';
import { useAdminProfile } from '../../features/admin/profile/model/useAdminProfile';
import {
  EditProfileModal,
  ProfileActionSection,
  ProfileHeaderCard,
  ProfileInfoSection,
  profileStyles,
} from '../../shared/ui/profile';

export const AdminProfileScreen: React.FC<{ navigation: any }> = () => {
  const {
    user,
    loading,
    editVisible,
    editName,
    editPhone,
    saving,
    setEditName,
    setEditPhone,
    openEdit,
    closeEdit,
    saveProfile,
    logoutWithConfirm,
  } = useAdminProfile();

  return (
    <ScrollView style={profileStyles.page}>
      <ProfileHeaderCard
        name={user?.fullName || 'Administrator'}
        roleLabel="Quản trị viên"
        accentColor="#FF3B30"
        icon="shield-checkmark"
      />

      <ProfileInfoSection
        loading={loading}
        loadingColor="#007AFF"
        email={user?.email || 'N/A'}
        phone={user?.phoneNumber || 'N/A'}
        roleDescription="Quản trị viên hệ thống"
      />

      <ProfileActionSection
        title="Quản lý Admin"
        items={[
          {
            key: 'manage-admins',
            label: 'Quản lý Admin khác',
            icon: 'people-outline',
            color: '#007AFF',
            onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
          },
          {
            key: 'activity-log',
            label: 'Nhật ký hoạt động',
            icon: 'document-text-outline',
            color: '#007AFF',
            onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
          },
          {
            key: 'permissions',
            label: 'Quyền truy cập',
            icon: 'key-outline',
            color: '#007AFF',
            onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
          },
        ]}
      />

      <ProfileActionSection
        title="Cài đặt"
        items={[
          {
            key: 'edit-profile',
            label: 'Chỉnh sửa thông tin',
            icon: 'create-outline',
            color: '#007AFF',
            onPress: openEdit,
          },
          {
            key: 'change-password',
            label: 'Đổi mật khẩu',
            icon: 'lock-closed-outline',
            color: '#007AFF',
            onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
          },
          {
            key: 'notifications',
            label: 'Thông báo',
            icon: 'notifications-outline',
            color: '#007AFF',
            onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
          },
          {
            key: 'logout',
            label: 'Đăng xuất',
            icon: 'log-out-outline',
            color: '#FF3B30',
            onPress: logoutWithConfirm,
            isDanger: true,
          },
        ]}
      />

      <EditProfileModal
        visible={editVisible}
        name={editName}
        phone={editPhone}
        saving={saving}
        primaryColor="#007AFF"
        onClose={closeEdit}
        onChangeName={setEditName}
        onChangePhone={setEditPhone}
        onSave={saveProfile}
      />
    </ScrollView>
  );
};
