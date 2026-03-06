import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  adminGraphqlService,
  GraphqlUser,
} from '../../../../shared/api/adminGraphqlService';
import { adminRestService } from '../../../../shared/api/adminRestService';

const EMPTY_FORM = { fullName: '', email: '', phoneNumber: '' };

export const useAgentManagement = () => {
  const [users, setUsers] = useState<GraphqlUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [createVisible, setCreateVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadAgents = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }
    try {
      const data = await adminGraphqlService.getUsersByRole('AGENT');
      setUsers(data);
    } catch (errorResponse: any) {
      Alert.alert('Loi', errorResponse?.message ?? 'Khong tai duoc danh sach tho');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

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
    loadAgents(true);
  }, [loadAgents]);

  const handleCreate = useCallback(async () => {
    if (!form.fullName.trim() || !form.email.trim() || !form.phoneNumber.trim()) {
      Alert.alert('Loi', 'Vui long nhap du ho ten, email, so dien thoai');
      return;
    }

    setCreating(true);
    try {
      await adminRestService.createAgent({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
      });
      setCreateVisible(false);
      setForm(EMPTY_FORM);
      await loadAgents(true);
      Alert.alert('Thanh cong', 'Tao tho thanh cong');
    } catch (errorResponse: any) {
      Alert.alert(
        'Loi',
        errorResponse?.response?.data?.message || errorResponse?.message || 'Tao tho that bai'
      );
    } finally {
      setCreating(false);
    }
  }, [form, loadAgents]);

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
