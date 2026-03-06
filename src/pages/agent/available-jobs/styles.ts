import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#fff', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  listContainer: { padding: 14, paddingBottom: 24 },
  emptyList: { flexGrow: 1 },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  jobTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
  status: { fontSize: 11, color: '#007AFF', fontWeight: '700' },
  jobMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  jobMetaText: { flex: 1, fontSize: 13, color: '#4B5563' },
});
