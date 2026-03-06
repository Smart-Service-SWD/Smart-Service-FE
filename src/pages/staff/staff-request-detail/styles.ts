import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
