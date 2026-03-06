import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../../../app/providers/auth/AuthContext';
import { adminGraphqlService } from '../../../../shared/api/adminGraphqlService';
import { staffRestService } from '../../../../shared/api/staffRestService';

export const useStaffProfile = () => {
  const { user, logout, updateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

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

  const openEdit = () => {
    setEditName(user?.fullName || '');
    setEditPhone(user?.phoneNumber || '');
    setEditVisible(true);
  };

  const closeEdit = () => setEditVisible(false);

  const saveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return;
    }

    setSaving(true);
    try {
      await staffRestService.updateProfile(editName.trim(), editPhone.trim());
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

  const logoutWithConfirm = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return {
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
  };
};
