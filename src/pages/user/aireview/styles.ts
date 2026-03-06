import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
