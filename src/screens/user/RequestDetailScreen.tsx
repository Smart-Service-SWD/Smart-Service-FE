import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    COMPLEXITY_LABEL,
    getServiceRequestById,
    ServiceRequestDetail,
    STATUS_COLOR,
    STATUS_LABEL,
} from '../../services/userService';

interface Props {
  navigation: any;
  route: { params: { requestId: string } };
}

const STEP_ORDER = [
  'AWAITING_ANALYSIS',
  'CREATED',
  'PENDING_REVIEW',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
];

export const RequestDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequest = useCallback(async () => {
    try {
      const data = await getServiceRequestById(requestId);
      setRequest(data);
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Không tải được chi tiết yêu cầu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId]);

  useEffect(() => { loadRequest(); }, [loadRequest]);

  const onRefresh = () => { setRefreshing(true); loadRequest(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!request) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Không tìm thấy yêu cầu</Text>
        <TouchableOpacity onPress={loadRequest} style={styles.retryBtn}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = STATUS_COLOR[request.status] ?? '#6B7280';
  const statusLabel = STATUS_LABEL[request.status] ?? request.status;
  const complexityLevel = request.complexity?.level ?? 0;
  const complexityLabel = COMPLEXITY_LABEL[complexityLevel] ?? `Mức ${complexityLevel}`;
  const currentStep = STEP_ORDER.indexOf(request.status);
  const isCancelled = request.status === 'CANCELLED';
  const isCompleted = request.status === 'COMPLETED';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: statusColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status badge */}
        <View style={styles.statusBadgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          {isCancelled && (
            <View style={styles.cancelledNote}>
              <Ionicons name="information-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.cancelledText}>Yêu cầu đã bị hủy</Text>
            </View>
          )}
        </View>

        {/* Progress stepper (hide if cancelled) */}
        {!isCancelled && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tiến trình</Text>
            {STEP_ORDER.map((step, idx) => {
              const done = idx < currentStep;
              const active = idx === currentStep;
              const color = done ? '#10B981' : active ? '#2563EB' : '#D1D5DB';
              return (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepCircle, { backgroundColor: color, borderColor: color }]}>
                      {done ? (
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      ) : (
                        <View style={[styles.stepInnerDot, { backgroundColor: active ? '#fff' : 'transparent' }]} />
                      )}
                    </View>
                    {idx < STEP_ORDER.length - 1 && (
                      <View style={[styles.stepLine, { backgroundColor: done ? '#10B981' : '#E5E7EB' }]} />
                    )}
                  </View>
                  <Text style={[styles.stepLabel, { color: done || active ? '#1F2937' : '#9CA3AF', fontWeight: active ? '700' : '400' }]}>
                    {STATUS_LABEL[step]}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Request info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin yêu cầu</Text>
          <InfoRow icon="document-text-outline" label="Mô tả" value={request.description ?? '—'} />
          {!!request.addressText && (
            <InfoRow icon="location-outline" label="Địa chỉ" value={request.addressText} />
          )}
          <InfoRow
            icon="calendar-outline"
            label="Ngày tạo"
            value={new Date(request.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          />
        </View>

        {/* AI Analysis summary */}
        {(complexityLevel > 0 || request.estimatedCost) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kết quả AI</Text>
            {complexityLevel > 0 && (
              <InfoRow icon="analytics-outline" label="Độ phức tạp" value={complexityLabel} />
            )}
            {request.estimatedCost && (
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Chi phí ước tính</Text>
                <Text style={styles.priceValue}>
                  {request.estimatedCost.amount.toLocaleString('vi-VN')}
                  {' '}{request.estimatedCost.currency}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Matching results */}
        {request.matchingResults?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nhà cung cấp được đề xuất</Text>
            {request.matchingResults.map((m, i) => (
              <View key={m.id} style={styles.matchItem}>
                <View style={[styles.matchRank, { backgroundColor: i === 0 ? '#FEF3C7' : '#F3F4F6' }]}>
                  <Text style={[styles.matchRankText, { color: i === 0 ? '#92400E' : '#6B7280' }]}>
                    #{i + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchScore}>
                    Điểm khớp: {(m.matchingScore * 100).toFixed(0)}%
                  </Text>
                  {m.isRecommended && (
                    <Text style={styles.matchRecommended}>★ Được khuyến nghị</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Attachments */}
        {request.attachments?.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tệp đính kèm ({request.attachments.length})</Text>
            {request.attachments.map(att => (
              <View key={att.id} style={styles.attItem}>
                <Ionicons name="document-outline" size={18} color="#6B7280" />
                <Text style={styles.attName} numberOfLines={1}>{att.fileName}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions for completed requests */}
        {isCompleted && (
          <TouchableOpacity
            style={styles.feedbackBtn}
            onPress={() => navigation.navigate('Feedback', { serviceRequestId: request.id })}
          >
            <Ionicons name="star" size={20} color="#fff" />
            <Text style={styles.feedbackBtnText}>Đánh giá dịch vụ</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color="#6B7280" />
    <View style={{ flex: 1 }}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorText: { fontSize: 16, color: '#6B7280', marginBottom: 16 },
  retryBtn: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#fff' },
  refreshBtn: { padding: 4, width: 40, alignItems: 'flex-end' },

  content: { padding: 16, paddingBottom: 40 },

  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: '700' },
  cancelledNote: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cancelledText: { fontSize: 12, color: '#EF4444' },

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
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Stepper
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  stepLeft: { alignItems: 'center', width: 28, marginRight: 12 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInnerDot: { width: 8, height: 8, borderRadius: 4 },
  stepLine: { width: 2, height: 20, marginTop: 2 },
  stepLabel: { fontSize: 14, paddingTop: 4, paddingBottom: 20, flex: 1 },

  // Info rows
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  infoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1F2937', lineHeight: 20 },

  priceBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: { fontSize: 14, color: '#1E40AF', fontWeight: '600' },
  priceValue: { fontSize: 18, fontWeight: '800', color: '#1D4ED8' },

  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  matchRank: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  matchRankText: { fontWeight: '700', fontSize: 14 },
  matchScore: { fontSize: 14, color: '#374151', fontWeight: '600' },
  matchRecommended: { fontSize: 12, color: '#F59E0B', fontWeight: '600', marginTop: 2 },

  attItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  attName: { flex: 1, fontSize: 14, color: '#1D4ED8' },

  feedbackBtn: {
    flexDirection: 'row',
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  feedbackBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
