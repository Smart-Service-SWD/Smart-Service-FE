import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  Switch,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminGraphqlService, ServiceListItem, ServiceCategory, GraphqlUser } from '../../services/adminGraphqlService';
import { adminRestService } from '../../services/adminRestService';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bookingCount: number;
}

interface ServiceForm {
  name: string;
  description: string;
  categoryId: string;   // auto-filled, hidden from user
  agentId: string;      // shown as 'Thợ phụ trách'
  basePrice: string;
  estimatedDuration: string;
  isActive: boolean;
}

const EMPTY_FORM: ServiceForm = {
  name: '',
  description: '',
  categoryId: '',
  agentId: '',
  basePrice: '',
  estimatedDuration: '',
  isActive: true,
};

export const ServiceManagementScreen: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [agents, setAgents] = useState<GraphqlUser[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);

  // ─── useMemo: tránh stale closure, reactive filter ───────────────────────────
  const filteredServices = useMemo(() => {
    let result = services;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q),
      );
    }
    if (selectedCategory !== 'all') {
      result = result.filter(s => s.category === selectedCategory);
    }
    return result;
  }, [services, searchQuery, selectedCategory]);

  const categoryFilters = useMemo(() => {
    const unique = Array.from(new Set(services.map(s => s.category)));
    return ['all', ...unique];
  }, [services]);

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

  const [categoriesLoading, setCategoriesLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const cats = await adminGraphqlService.getServiceCategories();
      setCategories(cats);
    } catch (e) {
      console.warn('Lỗi tải danh mục:', e);
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const loadAgents = useCallback(async () => {
    setAgentsLoading(true);
    try {
      const list = await adminGraphqlService.getUsersByRole('AGENT');
      setAgents(list);
    } catch (e) {
      console.warn('Lỗi tải thợ:', e);
    } finally {
      setAgentsLoading(false);
    }
  }, []);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [data, cats, agentList] = await Promise.all([
        adminGraphqlService.getServiceDefinitions(),
        adminGraphqlService.getServiceCategories(),
        adminGraphqlService.getUsersByRole('AGENT'),
      ]);
      setServices(data.map(mapService));
      if (cats.length > 0) setCategories(cats);
      setAgents(agentList);
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(true); };

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} phút`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h} giờ`;
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setIsAddMode(true);
    setSelectedService(null);
    // auto-assign first category if available (required by BE)
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' });
    setModalVisible(true);
  };

  const openEditModal = (service: Service) => {
    setIsAddMode(false);
    setSelectedService(service);
    const cat = categories.find(c => c.name === service.category);
    setForm({
      name: service.name,
      description: service.description,
      categoryId: cat?.id ?? categories[0]?.id ?? '',
      agentId: '',
      basePrice: String(service.price),
      estimatedDuration: String(service.duration),
      isActive: service.isActive,
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedService(null);
    setForm(EMPTY_FORM);
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên dịch vụ'); return; }
    if (!form.categoryId) {
      if (categories.length === 0) {
        Alert.alert('Lỗi', 'Chưa có danh mục nào. Vui lòng tải lại danh mục.');
      } else {
        Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      }
      return;
    }
    if (!form.categoryId && categories.length > 0) {
      setForm(prev => ({ ...prev, categoryId: categories[0].id }));
    }
    const price = parseFloat(form.basePrice);
    const duration = parseInt(form.estimatedDuration, 10);
    if (isNaN(price) || price < 0) { Alert.alert('Lỗi', 'Giá không hợp lệ'); return; }
    if (isNaN(duration) || duration <= 0) { Alert.alert('Lỗi', 'Thời gian không hợp lệ (phút)'); return; }

    setSaving(true);
    try {
      if (isAddMode) {
        await adminRestService.createService({
          categoryId: form.categoryId,
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          basePrice: price,
          estimatedDuration: duration,
        });
        Alert.alert('Thành công', 'Tạo dịch vụ thành công');
      } else if (selectedService) {
        await adminRestService.updateService(selectedService.id, {
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          basePrice: price,
          estimatedDuration: duration,
          isActive: form.isActive,
        });
        Alert.alert('Thành công', 'Cập nhật dịch vụ thành công');
      }
      closeModal();
      loadData(true);
    } catch (error) {
      Alert.alert('Lỗi', (error as any)?.response?.data?.message || (error as Error).message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (service: Service) => {
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
              setServices(prev => prev.filter(s => s.id !== service.id));
              Alert.alert('Thành công', 'Đã xóa dịch vụ');
            } catch (error) {
              Alert.alert('Lỗi', (error as any)?.response?.data?.message || 'Không thể xóa dịch vụ');
            }
          },
        },
      ],
    );
  };

  // ─── Render item ──────────────────────────────────────────────────────────────
  const renderServiceItem = useCallback(({ item }: { item: Service }) => (
    <View style={[styles.serviceCard, !item.isActive && styles.serviceCardInactive]}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>{item.description}</Text>
        </View>
        <View style={styles.serviceStatusBadge}>
          <View style={[styles.activeDot, { backgroundColor: item.isActive ? '#34C759' : '#FF3B30' }]} />
          <Text style={[styles.activeText, { color: item.isActive ? '#34C759' : '#FF3B30' }]}>
            {item.isActive ? 'Hoạt động' : 'Tạm dừng'}
          </Text>
        </View>
      </View>

      <View style={styles.serviceDetails}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <Text style={styles.servicePrice}>{formatCurrency(item.price)}</Text>
        <Text style={styles.serviceDuration}>{formatDuration(item.duration)}</Text>
      </View>

      <View style={styles.serviceStats}>
        <Ionicons name="calendar-outline" size={13} color="#999" />
        <Text style={styles.statText}>{item.bookingCount > 0 ? `${item.bookingCount} lượt đặt` : 'Chưa có lịch đặt'}</Text>
        <Ionicons name="time-outline" size={13} color="#999" style={{ marginLeft: 10 }} />
        <Text style={styles.statText}>{new Date(item.updatedAt).toLocaleDateString('vi-VN')}</Text>
      </View>

      <View style={styles.serviceActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF15' }]}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={14} color="#007AFF" />
          <Text style={[styles.actionText, { color: '#007AFF' }]}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FF3B3015' }]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={14} color="#FF3B30" />
          <Text style={[styles.actionText, { color: '#FF3B30' }]}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [categories]);

  // ─── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý dịch vụ</Text>
        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search + Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm dịch vụ..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {categoryFilters.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterButton, selectedCategory === cat && styles.filterButtonActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>
                {cat === 'all' ? 'Tất cả' : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filteredServices}
        renderItem={renderServiceItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={8}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        contentContainerStyle={[styles.listContainer, filteredServices.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <>
                <Ionicons name="construct-outline" size={48} color="#ddd" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có dịch vụ nào'}
                </Text>
              </>
            )}
          </View>
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isAddMode ? 'Thêm dịch vụ mới' : 'Chỉnh sửa dịch vụ'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Thợ phụ trách */}
              <Text style={styles.fieldLabel}>Thợ phụ trách</Text>
              {agentsLoading ? (
                <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 8 }} />
              ) : agents.length === 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Text style={{ color: '#FF3B30', fontSize: 13 }}>Chưa có thợ nào</Text>
                  <TouchableOpacity
                    style={{ backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                    onPress={loadAgents}
                  >
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Tải lại</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                  {agents.map(agent => (
                    <TouchableOpacity
                      key={agent.id}
                      style={[styles.categoryChip, form.agentId === agent.id && styles.categoryChipActive]}
                      onPress={() => setForm(prev => ({ ...prev, agentId: prev.agentId === agent.id ? '' : agent.id }))}
                    >
                      <Text style={[styles.categoryChipText, form.agentId === agent.id && styles.categoryChipTextActive]}>
                        {agent.fullName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Name */}
              <Text style={styles.fieldLabel}>Tên dịch vụ *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Nhập tên dịch vụ"
                value={form.name}
                onChangeText={v => setForm(prev => ({ ...prev, name: v }))}
              />

              {/* Description */}
              <Text style={styles.fieldLabel}>Mô tả</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                placeholder="Nhập mô tả dịch vụ"
                value={form.description}
                onChangeText={v => setForm(prev => ({ ...prev, description: v }))}
                multiline
                numberOfLines={3}
              />

              {/* Price */}
              <Text style={styles.fieldLabel}>Giá cơ bản (VNĐ) *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="VD: 150000"
                value={form.basePrice}
                onChangeText={v => setForm(prev => ({ ...prev, basePrice: v }))}
                keyboardType="numeric"
              />

              {/* Duration */}
              <Text style={styles.fieldLabel}>Thời gian ước tính (phút) *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="VD: 60"
                value={form.estimatedDuration}
                onChangeText={v => setForm(prev => ({ ...prev, estimatedDuration: v }))}
                keyboardType="numeric"
              />

              {/* IsActive (edit only) */}
              {!isAddMode && (
                <View style={styles.switchRow}>
                  <Text style={styles.fieldLabel}>Đang hoạt động</Text>
                  <Switch
                    value={form.isActive}
                    onValueChange={v => setForm(prev => ({ ...prev, isActive: v }))}
                    trackColor={{ false: '#E0E0E0', true: '#34C75960' }}
                    thumbColor={form.isActive ? '#34C759' : '#9E9E9E'}
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.btnCancel} onPress={closeModal}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.btnSaveText}>{isAddMode ? 'Tạo mới' : 'Lưu'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  addButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 14, color: '#333' },
  filterRow: { gap: 8, paddingBottom: 2 },
  filterButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F5F6FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterText: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  listContainer: { padding: 14 },
  emptyList: { flex: 1 },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  serviceCardInactive: { opacity: 0.6 },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: { flex: 1, marginRight: 8 },
  serviceName: { fontSize: 15, fontWeight: '600', color: '#1A1A2E', marginBottom: 3 },
  serviceDescription: { fontSize: 12, color: '#888', lineHeight: 17 },
  serviceStatusBadge: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  activeDot: { width: 7, height: 7, borderRadius: 3.5, marginRight: 4 },
  activeText: { fontSize: 11, fontWeight: '600' },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#007AFF15' },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#007AFF' },
  servicePrice: { fontSize: 13, fontWeight: '700', color: '#007AFF' },
  serviceDuration: { fontSize: 12, color: '#777' },
  serviceStats: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statText: { fontSize: 11, color: '#aaa', marginLeft: 4 },
  serviceActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionText: { fontSize: 12, fontWeight: '500', marginLeft: 3 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: { fontSize: 14, color: '#bbb', marginTop: 10 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  fieldLabel: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6, marginTop: 14 },
  fieldInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  fieldInputMulti: { height: 72, textAlignVertical: 'top', paddingTop: 10 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F5F6FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  categoryChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  categoryChipTextActive: { color: '#fff' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  btnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#F5F6FA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  btnCancelText: { fontSize: 14, color: '#555', fontWeight: '600' },
  btnSave: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.55 },
  btnSaveText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
