import React from 'react';
import {
  Alert,
  ScrollView,
} from 'react-native';
import { useStaffProfile } from '../../../features/staff/profile/model/useStaffProfile';
import {
  EditProfileModal,
  ProfileActionSection,
  ProfileHeaderCard,
  ProfileInfoSection,
  profileStyles,
} from '../../../shared/ui/profile';

export const StaffProfilePage: React.FC<{ navigation: any }> = () => {
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
  } = useStaffProfile();

  return (
    <ScrollView style={profileStyles.page}>
      <ProfileHeaderCard
        name={user?.fullName || 'Staff Member'}
        roleLabel="Nhân viên"
        accentColor="#1976D2"
        icon="briefcase"
      />

      <ProfileInfoSection
        loading={loading}
        loadingColor="#1976D2"
        email={user?.email || 'N/A'}
        phone={user?.phoneNumber || 'Chưa cập nhật'}
        roleDescription="Nhân viên xác nhận AI"
      />

      <ProfileActionSection
        title="Công việc"
        items={[
          {
            key: 'work-stats',
            label: 'Thống kê công việc',
            icon: 'stats-chart-outline',
            color: '#1976D2',
            onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
          },
          {
            key: 'work-history',
            label: 'Lịch sử đánh giá',
            icon: 'time-outline',
            color: '#1976D2',
            onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
          },
          {
            key: 'achievements',
            label: 'Thành tích',
            icon: 'trophy-outline',
            color: '#1976D2',
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
            color: '#1976D2',
            onPress: openEdit,
          },
          {
            key: 'change-password',
            label: 'Đổi mật khẩu',
            icon: 'lock-closed-outline',
            color: '#1976D2',
            onPress: () => Alert.alert('Thông báo', 'Chức năng đang phát triển'),
          },
          {
            key: 'notifications',
            label: 'Thông báo',
            icon: 'notifications-outline',
            color: '#1976D2',
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
        primaryColor="#1976D2"
        onClose={closeEdit}
        onChangeName={setEditName}
        onChangePhone={setEditPhone}
        onSave={saveProfile}
      />
    </ScrollView>
  );
};
