import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  analyzeServiceRequest,
  COMPLEXITY_LABEL,
  createActivityLog,
  requestStaffEvaluation,
  ServiceAnalysisResult,
  ServiceRequestDetail,
} from '../../services/userService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  navigation: any;
  route: {
    params: {
      serviceRequest: ServiceRequestDetail;
      analysisResult: ServiceAnalysisResult;
    };
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AIReviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { serviceRequest, analysisResult: initialAnalysis } = route.params;

  const [analysis, setAnalysis] = useState<ServiceAnalysisResult>(initialAnalysis);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [staffNote, setStaffNote] = useState('');
  const [sendingToStaff, setSendingToStaff] = useState(false);

  const complexityLevel = analysis.complexity?.level ?? 0;
  const complexityLabel = COMPLEXITY_LABEL[complexityLevel] ?? `Mức ${complexityLevel}`;
  const estimatedAmount = analysis.estimatedCost?.amount;
  const currency = analysis.estimatedCost?.currency ?? 'VND';

  // ── Re-analyze ──────────────────────────────────────────────────────────────
  const handleReAnalyze = async () => {
    Alert.alert(
      'Đánh giá lại',
      'AI sẽ phân tích lại yêu cầu của bạn. Bạn có muốn tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đánh giá lại',
          onPress: async () => {
            setReanalyzing(true);
            try {
              const newAnalysis = await analyzeServiceRequest(serviceRequest.description);
              setAnalysis(newAnalysis);
            } catch (err: any) {
              Alert.alert('Lỗi', err?.message ?? 'Không thể đánh giá lại');
            } finally {
              setReanalyzing(false);
            }
          },
        },
      ]
    );
  };

  // ── Accept AI result ────────────────────────────────────────────────────────
  const handleAccept = async () => {
    try {
      await createActivityLog(serviceRequest.id, 'Customer accepted AI analysis result');
    } catch {
      // ignore log errors
    }
    navigation.replace('RequestDetail', { requestId: serviceRequest.id });
  };

  // ── Send to Staff ───────────────────────────────────────────────────────────
  const handleSendToStaff = async () => {
    setSendingToStaff(true);
    try {
      const level = analysis.complexity?.level ?? 3;
      try {
        await requestStaffEvaluation(serviceRequest.id, level);
      } catch {
        // Một số status chưa cho evaluate trực tiếp; vẫn ghi log để staff theo dõi.
      }
      await createActivityLog(
        serviceRequest.id,
        `Customer requested manual review${staffNote.trim() ? `: ${staffNote.trim()}` : ''}`
      );
      setStaffModalVisible(false);
      Alert.alert(
        'Đã gửi',
        'Yêu cầu của bạn đã được gửi cho nhân viên để xem xét thủ công.',
        [{ text: 'OK', onPress: () => navigation.replace('RequestDetail', { requestId: serviceRequest.id }) }]
      );
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message ?? 'Không thể gửi yêu cầu');
    } finally {
      setSendingToStaff(false);
    }
  };

  // ── Complexity badge color ──────────────────────────────────────────────────
  const complexityColors: Record<number, string> = {
    1: '#10B981', 2: '#3B82F6', 3: '#F59E0B', 4: '#F97316', 5: '#EF4444',
  };
  const badgeColor = complexityColors[complexityLevel] ?? '#6B7280';

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kết quả phân tích AI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* AI Icon + intro */}
        <View style={styles.aiIntro}>
          <View style={styles.aiIconCircle}>
            <Ionicons name="sparkles" size={32} color="#8B5CF6" />
          </View>
          <Text style={styles.aiTitle}>AI đã phân tích xong</Text>
          <Text style={styles.aiSubtitle}>
            Dưới đây là kết quả đánh giá tự động cho yêu cầu dịch vụ của bạn.
          </Text>
        </View>

        {/* Yêu cầu gốc */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yêu cầu dịch vụ</Text>
          <Text style={styles.requestDesc}>{serviceRequest.description}</Text>
          {!!serviceRequest.addressText && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{serviceRequest.addressText}</Text>
            </View>
          )}
        </View>

        {/* Độ phức tạp */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Độ phức tạp</Text>
          <View style={styles.complexityRow}>
            {[1, 2, 3, 4, 5].map(lvl => (
              <View
                key={lvl}
                style={[
                  styles.complexityDot,
                  { backgroundColor: lvl <= complexityLevel ? badgeColor : '#E5E7EB' },
                ]}
              />
            ))}
            <View style={[styles.complexityBadge, { backgroundColor: badgeColor + '20' }]}>
              <Text style={[styles.complexityLabel, { color: badgeColor }]}>{complexityLabel}</Text>
            </View>
          </View>
        </View>

        {/* Chi phí ước tính */}
        {estimatedAmount !== undefined && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chi phí ước tính</Text>
            <Text style={styles.priceText}>
              {estimatedAmount.toLocaleString('vi-VN')}{' '}
              <Text style={styles.currency}>{currency}</Text>
            </Text>
            <Text style={styles.priceNote}>
              * Đây là mức giá ước tính. Giá cuối cùng sẽ được xác nhận sau khi nhân viên xem xét.
            </Text>
          </View>
        )}

        {/* Gợi ý / nhận xét AI */}
        {!!analysis.suggestions && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nhận xét của AI</Text>
            <Text style={styles.suggestText}>{analysis.suggestions}</Text>
          </View>
        )}
        {!!analysis.contextDescription && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mô tả bổ sung</Text>
            <Text style={styles.suggestText}>{analysis.contextDescription}</Text>
          </View>
        )}
        {!!analysis.dispatchRules && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gợi ý điều phối</Text>
            <Text style={styles.suggestText}>
              {`Skill: ${analysis.dispatchRules.requiredSkillLevel ?? '-'} | Kinh nghiệm: ${analysis.dispatchRules.minExperienceYears ?? '-'} năm`}
            </Text>
            <Text style={styles.suggestText}>
              {`Chứng chỉ: ${analysis.dispatchRules.requiresCertification ? 'Có' : 'Không'} | Senior: ${analysis.dispatchRules.requiresSeniorTechnician ? 'Có' : 'Không'}`}
            </Text>
          </View>
        )}

        {/* Hướng dẫn hành động */}
        <View style={styles.actionGuide}>
          <Text style={styles.actionGuideTitle}>Bước tiếp theo</Text>
          <View style={styles.guideItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={styles.guideText}>
              <Text style={{ fontWeight: '600' }}>Chấp nhận</Text> — đồng ý với kết quả AI, yêu cầu
              chuyển sang đợi nhân viên duyệt
            </Text>
          </View>
          <View style={styles.guideItem}>
            <Ionicons name="refresh-circle" size={18} color="#3B82F6" />
            <Text style={styles.guideText}>
              <Text style={{ fontWeight: '600' }}>Đánh giá lại</Text> — nếu bạn chưa hài lòng về
              nhận xét, yêu cầu AI phân tích lại
            </Text>
          </View>
          <View style={styles.guideItem}>
            <Ionicons name="people" size={18} color="#F59E0B" />
            <Text style={styles.guideText}>
              <Text style={{ fontWeight: '600' }}>Gửi staff xem xét</Text> — nếu bạn muốn nhân viên
              đánh giá thủ công (ví dụ giá quá cao)
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        {reanalyzing ? (
          <View style={styles.reanalyzingBox}>
            <ActivityIndicator color="#3B82F6" />
            <Text style={styles.reanalyzingText}>Đang phân tích lại…</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnAccept} onPress={handleAccept}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.btnText}>Chấp nhận</Text>
            </TouchableOpacity>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.btnReanalyze} onPress={handleReAnalyze}>
                <Ionicons name="refresh" size={18} color="#3B82F6" />
                <Text style={styles.btnReanalyzeText}>Đánh giá lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnStaff}
                onPress={() => setStaffModalVisible(true)}
              >
                <Ionicons name="people-outline" size={18} color="#F59E0B" />
                <Text style={styles.btnStaffText}>Gửi staff</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Staff Note Modal */}
      <Modal
        visible={staffModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStaffModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Gửi cho nhân viên xem xét</Text>
            <Text style={styles.modalSubtitle}>
              Nhân viên sẽ đánh giá lại thủ công yêu cầu của bạn. Bạn có thể thêm ghi chú
              (tùy chọn).
            </Text>
            <TextInput
              style={styles.noteInput}
              value={staffNote}
              onChangeText={setStaffNote}
              placeholder="VD: Giá ước tính quá cao, tôi muốn được đánh giá lại..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setStaffModalVisible(false)}
                disabled={sendingToStaff}
              >
                <Text style={styles.modalBtnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtnConfirm, sendingToStaff && { opacity: 0.6 }]}
                onPress={handleSendToStaff}
                disabled={sendingToStaff}
              >
                {sendingToStaff ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Gửi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#fff' },

  content: { padding: 20, paddingBottom: 40 },

  aiIntro: { alignItems: 'center', paddingVertical: 24 },
  aiIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  aiTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  aiSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

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
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 },

  requestDesc: { fontSize: 15, color: '#1F2937', lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  infoText: { fontSize: 13, color: '#6B7280' },

  complexityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  complexityDot: { width: 20, height: 20, borderRadius: 10 },
  complexityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  complexityLabel: { fontSize: 14, fontWeight: '700' },

  priceText: { fontSize: 28, fontWeight: '800', color: '#1F2937' },
  currency: { fontSize: 16, fontWeight: '400', color: '#6B7280' },
  priceNote: { fontSize: 12, color: '#9CA3AF', marginTop: 8, fontStyle: 'italic' },

  suggestText: { fontSize: 15, color: '#374151', lineHeight: 22 },

  actionGuide: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 10,
  },
  actionGuideTitle: { fontSize: 13, fontWeight: '700', color: '#92400E', marginBottom: 4 },
  guideItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  guideText: { flex: 1, fontSize: 13, color: '#78350F', lineHeight: 20 },

  actions: { gap: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },

  btnAccept: {
    flexDirection: 'row',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  btnReanalyze: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnReanalyzeText: { color: '#3B82F6', fontSize: 14, fontWeight: '700' },

  btnStaff: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnStaffText: { color: '#F59E0B', fontSize: 14, fontWeight: '700' },

  reanalyzingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  reanalyzingText: { color: '#3B82F6', fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 16 },
  noteInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 100,
    marginBottom: 20,
  },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  modalBtnCancelText: { color: '#374151', fontWeight: '600', fontSize: 15 },
  modalBtnConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
  },
  modalBtnConfirmText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
