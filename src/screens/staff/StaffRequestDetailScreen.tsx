import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ServiceAgent,
  ServiceRequestDetail,
  MatchingResult,
  staffGraphqlService,
} from '../../services/staffGraphqlService';
import { staffRestService } from '../../services/staffRestService';

// ─── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  AWAITING_ANALYSIS: { label: 'Chờ phân tích', color: '#9E9E9E' },
  CREATED: { label: 'Mới tạo', color: '#607D8B' },
  PENDING_REVIEW: { label: 'Chờ duyệt', color: '#FF9800' },
  APPROVED: { label: 'Đã duyệt', color: '#4CAF50' },
  ASSIGNED: { label: 'Đã phân công', color: '#2196F3' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: '#3F51B5' },
  COMPLETED: { label: 'Hoàn thành', color: '#4CAF50' },
  CANCELLED: { label: 'Đã hủy', color: '#F44336' },
  URGENT_DISPATCH: { label: 'Khẩn cấp', color: '#E91E63' },
};

const COMPLEXITY_LABEL: Record<number, string> = {
  1: 'Rất đơn giản',
  2: 'Đơn giản',
  3: 'Trung bình',
  4: 'Phức tạp',
  5: 'Rất phức tạp',
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

// ─── Component ──────────────────────────────────────────────────────────────────

export const StaffRequestDetailScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const { requestId } = route.params as { requestId: string };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [request, setRequest] = useState<ServiceRequestDetail | null>(null);
  const [agents, setAgents] = useState<ServiceAgent[]>([]);

  // Approval state
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [estimatedAmount, setEstimatedAmount] = useState<string>('');
  const [agentPickerVisible, setAgentPickerVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Complexity modal
  const [complexityModalVisible, setComplexityModalVisible] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number>(3);

  const loadData = useCallback(async () => {
    try {
      const [req, agentList] = await Promise.all([
        staffGraphqlService.getRequestDetail(requestId),
        staffGraphqlService.getServiceAgents(),
      ]);
      setRequest(req);
      setAgents(agentList);
      if (req) setSelectedLevel(req.complexity?.level ?? 3);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // ── Approve: assign provider ────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selectedAgentId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn nhà cung cấp dịch vụ');
      return;
    }
    const amount = parseFloat(estimatedAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập chi phí ước tính hợp lệ');
      return;
    }

    Alert.alert(
      'Xác nhận phê duyệt',
      `Bạn có chắc muốn phê duyệt yêu cầu này và phân công cho ${
        agents.find(a => a.id === selectedAgentId)?.fullName ?? selectedAgentId
      }?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Phê duyệt',
          onPress: async () => {
            try {
              setSubmitting(true);
              await staffRestService.assignProvider(requestId, {
                providerId: selectedAgentId,
                estimatedCost: { amount, currency: 'VND' },
              });
              Alert.alert('Thành công', 'Yêu cầu đã được phê duyệt và phân công thành công', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (err: any) {
              Alert.alert('Lỗi', err?.response?.data?.message ?? err?.message ?? 'Phê duyệt thất bại');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  // ── Re-evaluate complexity ──────────────────────────────────────────────────
  const handleEvaluateComplexity = async () => {
    try {
      setSubmitting(true);
      await staffRestService.evaluateComplexity(requestId, {
        complexity: { level: selectedLevel },
      });
      setComplexityModalVisible(false);
      Alert.alert('Thành công', `Đã cập nhật độ phức tạp: ${COMPLEXITY_LABEL[selectedLevel]}`);
      loadData();
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message ?? err?.message ?? 'Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Select from matching result ─────────────────────────────────────────────
  const handleSelectFromMatch = (match: MatchingResult) => {
    setSelectedAgentId(match.serviceAgentId);
    const agent = agents.find(a => a.id === match.serviceAgentId);
    if (agent) {
      Alert.alert('Đã chọn', `${agent.fullName} (Điểm khớp: ${(match.matchingScore * 100).toFixed(0)}%)`);
    }
  };

  // ─── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Đang tải chi tiết yêu cầu...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Không tìm thấy yêu cầu</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = STATUS_LABEL[request.status] ?? { label: request.status, color: '#607D8B' };
  const isPendingReview = request.status === 'PENDING_REVIEW';
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  // Sort matching results descending by score
  const sortedMatches = [...(request.matchingResults ?? [])].sort(
    (a, b) => b.matchingScore - a.matchingScore
  );

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <LinearGradient colors={['#1976D2', '#63a4ff']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Request Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Thông tin yêu cầu</Text>
            <InfoRow icon="document-text-outline" label="ID" value={request.id.slice(0, 8) + '...'} />
            <InfoRow icon="time-outline" label="Thời gian" value={fmt(request.createdAt)} />
            <InfoRow
              icon="layers-outline"
              label="Độ phức tạp"
              value={COMPLEXITY_LABEL[request.complexity?.level] ?? `Level ${request.complexity?.level}`}
            />
            {request.addressText ? (
              <InfoRow icon="location-outline" label="Địa chỉ" value={request.addressText} />
            ) : null}
            {request.description ? (
              <View style={styles.descriptionBox}>
                <Text style={styles.fieldLabel}>Mô tả:</Text>
                <Text style={styles.descriptionText}>{request.description}</Text>
              </View>
            ) : null}
          </View>

          {/* AI Matching Results */}
          {sortedMatches.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                Kết quả so khớp AI ({sortedMatches.length})
              </Text>
              {sortedMatches.map((match, idx) => {
                const agent = agents.find(a => a.id === match.serviceAgentId);
                const isSelected = selectedAgentId === match.serviceAgentId;
                return (
                  <TouchableOpacity
                    key={match.id}
                    style={[
                      styles.matchCard,
                      isSelected && styles.matchCardSelected,
                      match.isRecommended && styles.matchCardRecommended,
                    ]}
                    onPress={() => isPendingReview && handleSelectFromMatch(match)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.matchHeader}>
                      <View style={styles.matchRank}>
                        <Text style={styles.matchRankText}>#{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.agentName}>
                          {agent?.fullName ?? `Agent ${match.serviceAgentId.slice(0, 8)}`}
                        </Text>
                        {match.isRecommended && (
                          <View style={styles.recommendedTag}>
                            <Ionicons name="star" size={12} color="#FF9800" />
                            <Text style={styles.recommendedText}>Được khuyến nghị</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.scoreCircle}>
                        <Text style={styles.scoreText}>
                          {(match.matchingScore * 100).toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scoreBar}>
                      <View
                        style={[
                          styles.scoreBarFill,
                          {
                            width: `${Math.min(match.matchingScore * 100, 100)}%` as any,
                            backgroundColor: match.isRecommended ? '#4CAF50' : '#1976D2',
                          },
                        ]}
                      />
                    </View>
                    {isPendingReview && (
                      <TouchableOpacity
                        style={[
                          styles.selectAgentBtn,
                          isSelected && styles.selectAgentBtnActive,
                        ]}
                        onPress={() => handleSelectFromMatch(match)}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'radio-button-off'}
                          size={18}
                          color={isSelected ? '#fff' : '#1976D2'}
                        />
                        <Text style={[styles.selectAgentText, isSelected && { color: '#fff' }]}>
                          {isSelected ? 'Đã chọn' : 'Chọn'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Attachments */}
          {request.attachments?.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tệp đính kèm ({request.attachments.length})</Text>
              {request.attachments.map(att => (
                <View key={att.id} style={styles.attachmentRow}>
                  <Ionicons name="attach-outline" size={18} color="#607D8B" />
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {att.fileName}
                  </Text>
                  <Text style={styles.attachmentType}>{att.type}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Approval Section (only for PENDING_REVIEW) */}
          {isPendingReview && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Phê duyệt yêu cầu</Text>

              {/* Provider selection */}
              <Text style={styles.fieldLabel}>Nhà cung cấp được chọn *</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setAgentPickerVisible(true)}
              >
                <Ionicons name="person-outline" size={18} color="#1976D2" />
                <Text style={styles.pickerBtnText}>
                  {selectedAgent ? selectedAgent.fullName : 'Chọn nhà cung cấp...'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#666" />
              </TouchableOpacity>

              {/* Estimated cost */}
              <Text style={styles.fieldLabel}>Chi phí ước tính (VND) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập chi phí ước tính..."
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={estimatedAmount}
                onChangeText={setEstimatedAmount}
              />

              {/* Action buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.complexityBtn}
                  onPress={() => setComplexityModalVisible(true)}
                >
                  <Ionicons name="layers-outline" size={18} color="#FF9800" />
                  <Text style={styles.complexityBtnText}>Đánh giá lại độ phức tạp</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.approveBtn, submitting && { opacity: 0.7 }]}
                onPress={handleApprove}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    <Text style={styles.approveBtnText}>Phê duyệt &amp; Phân công</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Agent Picker Modal */}
      <Modal
        visible={agentPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAgentPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn nhà cung cấp</Text>
              <TouchableOpacity onPress={() => setAgentPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {agents
                .filter(a => a.isActive)
                .map(agent => {
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <TouchableOpacity
                      key={agent.id}
                      style={[styles.agentItem, isSelected && styles.agentItemSelected]}
                      onPress={() => {
                        setSelectedAgentId(agent.id);
                        setAgentPickerVisible(false);
                      }}
                    >
                      <View style={styles.agentAvatar}>
                        <Text style={styles.agentAvatarText}>
                          {agent.fullName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.agentItemName}>{agent.fullName}</Text>
                        <Text style={styles.agentItemSub}>
                          {agent.capabilities.length} kỹ năng &bull; Đang hoạt động
                        </Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={22} color="#1976D2" />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Complexity Modal */}
      <Modal
        visible={complexityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setComplexityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đánh giá độ phức tạp</Text>
              <TouchableOpacity onPress={() => setComplexityModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            {[1, 2, 3, 4, 5].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.complexityItem,
                  selectedLevel === level && styles.complexityItemSelected,
                ]}
                onPress={() => setSelectedLevel(level)}
              >
                <Text
                  style={[
                    styles.complexityItemText,
                    selectedLevel === level && { color: '#1976D2', fontWeight: '700' },
                  ]}
                >
                  {level} – {COMPLEXITY_LABEL[level]}
                </Text>
                {selectedLevel === level && (
                  <Ionicons name="checkmark" size={20} color="#1976D2" />
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.approveBtn, { marginTop: 12 }, submitting && { opacity: 0.7 }]}
              onPress={handleEvaluateComplexity}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.approveBtnText}>Cập nhật</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── Sub-component ──────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ icon: string; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon as any} size={16} color="#607D8B" style={{ marginRight: 6 }} />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

// ─── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: '#666', marginTop: 8 },
  emptyText: { color: '#999', fontSize: 16 },
  backBtn: { backgroundColor: '#1976D2', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },

  header: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backIcon: { padding: 4 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 20, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  content: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a2e', marginBottom: 12 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#607D8B', minWidth: 90 },
  infoValue: { fontSize: 13, color: '#333', flex: 1, flexWrap: 'wrap' },

  descriptionBox: { marginTop: 4, backgroundColor: '#f5f6fa', borderRadius: 8, padding: 10 },
  fieldLabel: { fontSize: 13, color: '#607D8B', marginBottom: 4, marginTop: 8 },
  descriptionText: { fontSize: 14, color: '#333', lineHeight: 20 },

  // Matching
  matchCard: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  matchCardSelected: { borderColor: '#1976D2', backgroundColor: '#E3F2FD' },
  matchCardRecommended: { borderColor: '#4CAF50' },
  matchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  matchRank: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#1976D2', justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
  },
  matchRankText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  agentName: { fontSize: 14, fontWeight: '600', color: '#1a1a2e' },
  recommendedTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  recommendedText: { fontSize: 11, color: '#FF9800', fontWeight: '600' },
  scoreCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#1976D2',
  },
  scoreText: { fontSize: 12, fontWeight: '700', color: '#1976D2' },
  scoreBar: {
    height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, marginBottom: 8, overflow: 'hidden',
  },
  scoreBarFill: { height: '100%', borderRadius: 3 },
  selectAgentBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#1976D2', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-end',
  },
  selectAgentBtnActive: { backgroundColor: '#1976D2' },
  selectAgentText: { fontSize: 13, color: '#1976D2', fontWeight: '600' },

  // Attachments
  attachmentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  attachmentName: { flex: 1, fontSize: 13, color: '#333' },
  attachmentType: { fontSize: 11, color: '#9E9E9E', backgroundColor: '#f0f0f0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },

  // Approval
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#1976D2', borderRadius: 10,
    padding: 12, backgroundColor: '#E3F2FD', marginBottom: 4,
  },
  pickerBtnText: { flex: 1, fontSize: 14, color: '#333' },
  input: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 12, fontSize: 14, color: '#333', marginBottom: 4,
    backgroundColor: '#fafafa',
  },
  actionRow: { marginVertical: 8 },
  complexityBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#FF9800', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start',
  },
  complexityBtnText: { color: '#FF9800', fontSize: 13, fontWeight: '600' },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#1976D2', borderRadius: 12,
    paddingVertical: 14, marginTop: 8,
  },
  approveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e' },
  agentItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  agentItemSelected: { backgroundColor: '#E3F2FD', borderRadius: 8, paddingHorizontal: 8 },
  agentAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1976D2', justifyContent: 'center', alignItems: 'center',
  },
  agentAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  agentItemName: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  agentItemSub: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  complexityItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  complexityItemSelected: { backgroundColor: '#E3F2FD', borderRadius: 8 },
  complexityItemText: { fontSize: 15, color: '#333' },
});
