import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminGraphqlService } from '../../services/adminGraphqlService';
import { adminRestService } from '../../services/adminRestService';

interface Agent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  businessName: string;
  address: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joinDate: string;
  servicesOffered: string[];
  totalRevenue: number;
  completedOrders: number;
  averageRating: number;
  commissionRate: number; // percentage
}

export const AgentManagementScreen: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // Create agent form
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createForm, setCreateForm] = useState({ fullName: '', email: '', phoneNumber: '' });
  const [creating, setCreating] = useState(false);

  const statuses = ['all', 'active', 'inactive', 'pending', 'suspended'];

  // Dùng useMemo để filter trực tiếp — tránh stale closure
  const filteredAgents = useMemo(() => {
    let filtered = agents;
    if (searchQuery.trim()) {
      filtered = filtered.filter(agent =>
        agent.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.businessName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(agent => agent.status === selectedStatus);
    }
    return filtered;
  }, [agents, searchQuery, selectedStatus]);


  const loadAgents = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const users = await adminGraphqlService.getUsersByRole('AGENT');
      const mapped: Agent[] = users.map(u => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phoneNumber: u.phoneNumber ?? '',
        businessName: u.fullName,
        address: '',
        status: 'active' as const,
        joinDate: new Date().toISOString().split('T')[0],
        servicesOffered: [],
        totalRevenue: 0,
        completedOrders: 0,
        averageRating: 0,
        commissionRate: 0,
      }));
      setAgents(mapped);
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message || 'Không thể tải danh sách thợ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAgents(true);
  };

  const handleCreateAgent = async () => {
    const { fullName, email, phoneNumber } = createForm;
    if (!fullName.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập họ tên'); return; }
    if (!email.trim() || !email.includes('@')) { Alert.alert('Lỗi', 'Email không hợp lệ'); return; }
    if (!phoneNumber.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại'); return; }
    setCreating(true);
    try {
      await adminRestService.createAgent({ fullName: fullName.trim(), email: email.trim(), phoneNumber: phoneNumber.trim() });
      Alert.alert('Thành công', 'Tạo thợ thành công');
      setCreateModalVisible(false);
      setCreateForm({ fullName: '', email: '', phoneNumber: '' });
      loadAgents(true);
    } catch (error) {
      Alert.alert('Lỗi', (error as any)?.response?.data?.message || (error as Error).message || 'Tạo thợ thất bại');
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#34C759';
      case 'inactive': return '#8E8E93';
      case 'pending': return '#FF9500';
      case 'suspended': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'inactive': return 'Tạm dừng';
      case 'pending': return 'Chờ duyệt';
      case 'suspended': return 'Bị khóa';
      default: return status;
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#34C759';
    if (rating >= 4.0) return '#FF9500';
    return '#FF3B30';
  };

  const handleAgentAction = (agent: Agent, action: string) => {
    switch (action) {
      case 'approve':
        Alert.alert(
          'Xác nhận',
          `Bạn có chắc chắn muốn phê duyệt thợ ${agent.businessName}?`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Phê duyệt',
              onPress: () => {
                setAgents(prev => prev.map(a => 
                  a.id === agent.id 
                    ? { ...a, status: 'active' as any }
                    : a
                ));
              }
            },
          ]
        );
        break;
      case 'suspend':
        const newStatus = agent.status === 'suspended' ? 'active' : 'suspended';
        Alert.alert(
          'Xác nhận',
          `Bạn có chắc chắn muốn ${newStatus === 'suspended' ? 'khóa' : 'mở khóa'} thợ ${agent.businessName}?`,
          [
            { text: 'Hủy', style: 'cancel' },
            { 
              text: 'Xác nhận',
              onPress: () => {
                setAgents(prev => prev.map(a => 
                  a.id === agent.id 
                    ? { ...a, status: newStatus as any }
                    : a
                ));
              }
            },
          ]
        );
        break;
      case 'edit_commission':
        Alert.alert('Thông báo', 'Chức năng chỉnh sửa hoa hồng đang được phát triển');
        break;
      case 'view_details':
        setSelectedAgent(agent);
        setModalVisible(true);
        break;
    }
  };

  const renderAgentItem = ({ item }: { item: Agent }) => (
    <TouchableOpacity 
      style={styles.agentCard}
      onPress={() => handleAgentAction(item, 'view_details')}
    >
      <View style={styles.agentHeader}>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{item.fullName}</Text>
          <Text style={styles.businessName}>{item.businessName}</Text>
          <Text style={styles.agentEmail}>{item.email}</Text>
        </View>
        <View style={styles.agentBadges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.agentStats}>
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={16} color="#34C759" />
            <Text style={styles.statText}>Doanh thu: {formatCurrency(item.totalRevenue)}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#007AFF" />
            <Text style={styles.statText}>{item.completedOrders} đơn hoàn thành</Text>
          </View>
        </View>
        
        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={16} color={getRatingColor(item.averageRating)} />
            <Text style={styles.statText}>Đánh giá: {item.averageRating}/5.0</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="trending-up-outline" size={16} color="#FF9500" />
            <Text style={styles.statText}>Hoa hồng: {item.commissionRate}%</Text>
          </View>
        </View>
      </View>

      <View style={styles.servicesContainer}>
        <Text style={styles.servicesLabel}>Dịch vụ cung cấp:</Text>
        <View style={styles.servicesTags}>
          {item.servicesOffered.slice(0, 2).map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>{service}</Text>
            </View>
          ))}
          {item.servicesOffered.length > 2 && (
            <View style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>+{item.servicesOffered.length - 2}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.agentActions}>
        {item.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#34C75920' }]}
            onPress={() => handleAgentAction(item, 'approve')}
          >
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={[styles.actionText, { color: '#34C759' }]}>Phê duyệt</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#007AFF20' }]}
          onPress={() => handleAgentAction(item, 'edit_commission')}
        >
          <Ionicons name="trending-up" size={16} color="#007AFF" />
          <Text style={[styles.actionText, { color: '#007AFF' }]}>Hoa hồng</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: item.status === 'suspended' ? '#34C75920' : '#FF3B3020' }]}
          onPress={() => handleAgentAction(item, 'suspend')}
        >
          <Ionicons 
            name={item.status === 'suspended' ? "checkmark-circle" : "ban"} 
            size={16} 
            color={item.status === 'suspended' ? '#34C759' : '#FF3B30'} 
          />
          <Text style={[styles.actionText, { color: item.status === 'suspended' ? '#34C759' : '#FF3B30' }]}>
            {item.status === 'suspended' ? 'Mở khóa' : 'Khóa'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản lý thợ</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="hammer-outline" size={20} color="#007AFF" />
          <Text style={styles.addText}>Thêm</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm thợ..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.filterText,
                selectedStatus === status && styles.filterTextActive
              ]}>
                {status === 'all' ? 'Tất cả' : getStatusText(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Agents List */}
      <FlatList
        data={filteredAgents}
        renderItem={renderAgentItem}
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
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#007AFF" />
            ) : (
              <>
                <Ionicons name="hammer-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>Không tìm thấy thợ nào</Text>
              </>
            )}
          </View>
        }
      />

      {/* Agent Detail Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedAgent && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chi tiết thợ</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.detailLabel}>Tên thợ:</Text>
                  <Text style={styles.detailValue}>{selectedAgent.fullName}</Text>
                  
                  <Text style={styles.detailLabel}>Tên doanh nghiệp:</Text>
                  <Text style={styles.detailValue}>{selectedAgent.businessName}</Text>
                  
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{selectedAgent.email}</Text>
                  
                  <Text style={styles.detailLabel}>Số điện thoại:</Text>
                  <Text style={styles.detailValue}>{selectedAgent.phoneNumber}</Text>
                  
                  <Text style={styles.detailLabel}>Địa chỉ:</Text>
                  <Text style={styles.detailValue}>{selectedAgent.address}</Text>
                  
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedAgent.status) }]}>
                    {getStatusText(selectedAgent.status)}
                  </Text>
                  
                  <Text style={styles.detailLabel}>Dịch vụ cung cấp:</Text>
                  {selectedAgent.servicesOffered.map((service, index) => (
                    <Text key={index} style={styles.detailValue}>• {service}</Text>
                  ))}
                  
                  <Text style={styles.detailLabel}>Doanh thu tổng:</Text>
                  <Text style={[styles.detailValue, { color: '#34C759' }]}>
                    {formatCurrency(selectedAgent.totalRevenue)}
                  </Text>
                  
                  <Text style={styles.detailLabel}>Đơn hàng hoàn thành:</Text>
                  <Text style={styles.detailValue}>{selectedAgent.completedOrders}</Text>
                  
                  <Text style={styles.detailLabel}>Đánh giá trung bình:</Text>
                  <Text style={[styles.detailValue, { color: getRatingColor(selectedAgent.averageRating) }]}>
                    {selectedAgent.averageRating}/5.0 ⭐
                  </Text>
                  
                  <Text style={styles.detailLabel}>Tỷ lệ hoa hồng:</Text>
                  <Text style={styles.detailValue}>{selectedAgent.commissionRate}%</Text>
                  
                  <Text style={styles.detailLabel}>Ngày tham gia:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedAgent.joinDate).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Create Agent Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={createModalVisible}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={styles.createSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm thợ mới</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.detailLabel}>Họ tên *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Nhập họ tên"
              value={createForm.fullName}
              onChangeText={v => setCreateForm(p => ({ ...p, fullName: v }))}
            />
            <Text style={styles.detailLabel}>Email *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Nhập email"
              value={createForm.email}
              onChangeText={v => setCreateForm(p => ({ ...p, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Text style={styles.detailLabel}>Số điện thoại *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Nhập số điện thoại"
              value={createForm.phoneNumber}
              onChangeText={v => setCreateForm(p => ({ ...p, phoneNumber: v }))}
              keyboardType="phone-pad"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: Platform.OS === 'ios' ? 20 : 10 }}>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, backgroundColor: '#F5F6FA', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' }}
                onPress={() => setCreateModalVisible(false)}
              >
                <Text style={{ color: '#555', fontWeight: '600' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1, paddingVertical: 12, backgroundColor: '#007AFF', borderRadius: 10, alignItems: 'center', opacity: creating ? 0.6 : 1 }}
                onPress={handleCreateAgent}
                disabled={creating}
              >
                {creating
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: '#fff', fontWeight: '600' }}>Tạo mới</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF20',
  },
  addText: {
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  searchSection: {
    padding: 20,
    backgroundColor: '#fff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
  },
  filterRowContent: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  agentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  businessName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  agentEmail: {
    fontSize: 12,
    color: '#666',
  },
  agentBadges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  agentStats: {
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  servicesContainer: {
    marginBottom: 12,
  },
  servicesLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  servicesTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  serviceTagText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '500',
  },
  agentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  createSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  formInput: {
    backgroundColor: '#F5F6FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginBottom: 4,
  },
});