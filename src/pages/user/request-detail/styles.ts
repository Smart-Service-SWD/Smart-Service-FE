import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
