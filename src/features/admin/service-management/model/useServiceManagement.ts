import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  adminGraphqlService,
  ServiceCategory,
  ServiceListItem,
} from '../../../../shared/api/adminGraphqlService';
import { adminRestService } from '../../../../shared/api/adminRestService';
import { EMPTY_FORM, Service, ServiceForm } from './types';

const mapService = (item: ServiceListItem): Service => ({
  id: item.id,
  name: item.name,
  description: item.description || '',
  category: item.categoryName,
  price: Number(item.basePrice) || 0,
  duration: item.estimatedDuration,
  isActive: item.isActive,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  bookingCount: item.bookingCount,
});

export const useServiceManagement = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

  const [catModalVisible, setCatModalVisible] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catCreating, setCatCreating] = useState(false);

  const filteredServices = useMemo(() => {
    let result = services;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        service =>
          service.name.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query) ||
          service.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(service => service.category === selectedCategory);
    }

    return result;
  }, [searchQuery, selectedCategory, services]);

  const categoryFilters = useMemo(() => {
    const uniqueCategories = Array.from(new Set(services.map(service => service.category)));
    return ['all', ...uniqueCategories];
  }, [services]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) {
      setLoading(true);
    }

    try {
      const [serviceData, categoryData] = await Promise.all([
        adminGraphqlService.getServiceDefinitions(),
        adminGraphqlService.getServiceCategories(),
      ]);
      setServices(serviceData.map(mapService));
      if (categoryData.length > 0) {
        setCategories(categoryData);
      }
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const openAddModal = useCallback(() => {
    setIsAddMode(true);
    setSelectedService(null);
    setForm({ ...EMPTY_FORM, categoryId: '' });
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((service: Service) => {
    setIsAddMode(false);
    setSelectedService(service);
    const mappedCategory = categories.find(category => category.name === service.category);
    setForm({
      name: service.name,
      description: service.description,
      categoryId: mappedCategory?.id ?? categories[0]?.id ?? '',
      basePrice: String(service.price),
      estimatedDuration: String(service.duration),
      isActive: service.isActive,
    });
    setModalVisible(true);
  }, [categories]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setSelectedService(null);
    setForm(EMPTY_FORM);
  }, []);

  const handleCreateCategory = useCallback(async () => {
    if (!catName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    setCatCreating(true);
    try {
      await adminRestService.createServiceCategory(catName.trim(), catDescription.trim());
      Alert.alert('Thành công', `Đã tạo danh mục "${catName.trim()}"`);
      setCatName('');
      setCatDescription('');
      setCatModalVisible(false);
      loadData(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể tạo danh mục');
    } finally {
      setCatCreating(false);
    }
  }, [catDescription, catName, loadData]);

  const handleSave = useCallback(async () => {
    if (!form.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên dịch vụ');
      return;
    }

    if (!form.categoryId) {
      if (categories.length === 0) {
        Alert.alert('Lỗi', 'Chưa có danh mục nào. Vui lòng tải lại danh mục.');
      } else {
        Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      }
      return;
    }

    const parsedPrice = parseFloat(form.basePrice);
    const parsedDuration = parseInt(form.estimatedDuration, 10);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      Alert.alert('Lỗi', 'Giá không hợp lệ');
      return;
    }

    if (Number.isNaN(parsedDuration) || parsedDuration <= 0) {
      Alert.alert('Lỗi', 'Thời gian không hợp lệ (phút)');
      return;
    }

    setSaving(true);
    try {
      if (isAddMode) {
        await adminRestService.createService({
          categoryId: form.categoryId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          basePrice: parsedPrice,
          estimatedDuration: parsedDuration,
        });
        Alert.alert('Thành công', 'Tạo dịch vụ thành công');
      } else if (selectedService) {
        await adminRestService.updateService(selectedService.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          basePrice: parsedPrice,
          estimatedDuration: parsedDuration,
          isActive: form.isActive,
        });
        Alert.alert('Thành công', 'Cập nhật dịch vụ thành công');
      }

      closeModal();
      loadData(true);
    } catch (error: any) {
      Alert.alert(
        'Lỗi',
        error?.response?.data?.message || error?.message || 'Thao tác thất bại'
      );
    } finally {
      setSaving(false);
    }
  }, [categories.length, closeModal, form, isAddMode, loadData, selectedService]);

  const handleDelete = useCallback((service: Service) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa dịch vụ "${service.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminRestService.deleteService(service.id);
              setServices(previousServices => previousServices.filter(item => item.id !== service.id));
              Alert.alert('Thành công', 'Đã xóa dịch vụ');
            } catch (error: any) {
              Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể xóa dịch vụ');
            }
          },
        },
      ]
    );
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }, []);

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours} giờ`;
  }, []);

  return {
    services,
    categories,
    activeTab,
    searchQuery,
    selectedCategory,
    refreshing,
    loading,
    saving,
    modalVisible,
    isAddMode,
    selectedService,
    form,
    catModalVisible,
    catName,
    catDescription,
    catCreating,
    filteredServices,
    categoryFilters,
    setActiveTab,
    setSearchQuery,
    setSelectedCategory,
    setModalVisible,
    setForm,
    setCatModalVisible,
    setCatName,
    setCatDescription,
    onRefresh,
    openAddModal,
    openEditModal,
    closeModal,
    handleCreateCategory,
    handleSave,
    handleDelete,
    formatCurrency,
    formatDuration,
  };
};
