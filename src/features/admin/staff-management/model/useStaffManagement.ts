import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  adminGraphqlService,
  GraphqlUser,
} from '../../../../shared/api/adminGraphqlService';
import { adminRestService } from '../../../../shared/api/adminRestService';

const EMPTY_FORM = { fullName: '', email: '', phoneNumber: '' };

export const useStaffManagement = () => {
  const [users, setUsers] = useState<GraphqlUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadStaff = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    try {
      const data = await adminGraphqlService.getUsersByRole('STAFF');
      setUsers(data);
    } catch (errorResponse: any) {
      Alert.alert('Loi', errorResponse?.message ?? 'Khong tai duoc danh sach nhan vien');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return users;
    }
    const query = search.toLowerCase();
    return users.filter(
      user =>
        user.fullName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phoneNumber || '').toLowerCase().includes(query)
    );
  }, [search, users]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStaff(true);
  }, [loadStaff]);

  const handleCreate = useCallback(async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      Alert.alert('Loi', 'Vui long nhap du ho ten, email, so dien thoai');
      return;
    }

    setCreating(true);
    try {
      await adminRestService.createStaff({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });
      setCreateVisible(false);
      setForm(EMPTY_FORM);
      await loadStaff(true);
      Alert.alert('Thanh cong', 'Tao nhan vien thanh cong');
    } catch (errorResponse: any) {
      Alert.alert(
        'Loi',
        errorResponse?.response?.data?.message ||
          errorResponse?.message ||
          'Tao nhan vien that bai'
      );
    } finally {
      setCreating(false);
    }
  }, [form, loadStaff]);

  const toggleLock = useCallback(async (user: GraphqlUser) => {
    try {
      await adminRestService.lockUser(user.id, !user.isLocked);
      setUsers(previousUsers =>
        previousUsers.map(item =>
          item.id === user.id ? { ...item, isLocked: !user.isLocked } : item
        )
      );
    } catch (errorResponse: any) {
      Alert.alert(
        'Loi',
        errorResponse?.response?.data?.message ||
          errorResponse?.message ||
          'Khong the cap nhat trang thai khoa'
      );
    }
  }, []);

  return {
    users: filtered,
    loading,
    refreshing,
    search,
    createVisible,
    creating,
    form,
    setSearch,
    setCreateVisible,
    setForm,
    onRefresh,
    handleCreate,
    toggleLock,
  };
};
