import React from 'react';
import {
  ScrollView,
} from 'react-native';
import { useAgentProfile } from '../../features/agent/profile/model/useAgentProfile';
import {
  EditProfileModal,
  ProfileActionSection,
  ProfileHeaderCard,
  ProfileInfoSection,
  profileStyles,
} from '../../shared/ui/profile';

export const AgentProfileScreen: React.FC<{ navigation: any }> = () => {
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
  } = useAgentProfile();

  return (
    <ScrollView style={profileStyles.page}>
      <ProfileHeaderCard
        name={user?.fullName || 'Service Provider'}
        roleLabel="Nhà cung cấp dịch vụ"
        accentColor="#34C759"
        icon="construct"
      />

      <ProfileInfoSection
        loading={loading}
        loadingColor="#34C759"
        email={user?.email || 'N/A'}
        phone={user?.phoneNumber || 'N/A'}
        roleDescription="Thợ cung cấp dịch vụ"
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
        primaryColor="#34C759"
        onClose={closeEdit}
        onChangeName={setEditName}
        onChangePhone={setEditPhone}
        onSave={saveProfile}
      />
    </ScrollView>
  );
};
