import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import { adminGraphqlService } from '../../../../shared/api/adminGraphqlService';
import { updateProfile } from '../../../../shared/api/userService';

interface ProfileUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#F8C471',
];

export const useUserProfile = () => {
  const { user: authUser, logout, updateProfile: updateAuthProfile } = useAuth();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const loadProfileData = useCallback(async () => {
    if (!authUser?.id) {
      setError('Không tìm thấy thông tin đăng nhập');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const currentUser = await adminGraphqlService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Không tải được dữ liệu');
      }

      setProfileUser({
        id: currentUser.id,
        fullName: currentUser.fullName,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || '',
        role: currentUser.role,
      });
    } catch (errorResponse: any) {
      const errorMessage = errorResponse?.message ?? 'Không tải được dữ liệu';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const getAvatarColor = (name: string) => {
    if (!name) {
      return '#ccc';
    }
    const charCode = name.charAt(0).toUpperCase().charCodeAt(0);
    return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
  };

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

  const logoutWithConfirm = () => {
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

  const closeEditModal = () => setEditModalVisible(false);

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống');
      return;
    }

    setEditSaving(true);
    try {
      await updateProfile({ fullName: editFullName.trim(), phoneNumber: editPhone.trim() });
      setProfileUser(previousUser =>
        previousUser
          ? { ...previousUser, fullName: editFullName.trim(), phoneNumber: editPhone.trim() }
          : previousUser
      );
      await updateAuthProfile({ fullName: editFullName.trim(), phoneNumber: editPhone.trim() });
      setEditModalVisible(false);
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật');
    } catch (errorResponse: any) {
      Alert.alert(
        'Lỗi',
        errorResponse?.response?.data?.message ?? errorResponse?.message ?? 'Không thể cập nhật hồ sơ'
      );
    } finally {
      setEditSaving(false);
    }
  };

  return {
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
  };
};
