import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F6FA' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { marginTop: 10, color: '#999', fontSize: 13 },
  emptyText:   { marginTop: 12, color: '#aaa', fontSize: 14, textAlign: 'center' },

  // Header
  header: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  // Summary strip
  summaryStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    gap: 4,
  },
  summaryTile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryCount: { fontSize: 20, fontWeight: '700' },
  summaryLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: { borderBottomColor: '#007AFF' },
  tabText:         { fontSize: 14, color: '#888', fontWeight: '500' },
  tabTextActive:   { color: '#007AFF', fontWeight: '700' },

  // List
  listContainer: { padding: 12, paddingBottom: 30 },
  emptyList:     { flex: 1, justifyContent: 'center' },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  dot:       { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  dateText:  { fontSize: 11, color: '#aaa' },

  customerName: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },

  divider: { height: 1, backgroundColor: '#F0F1F5', marginBottom: 8 },

  infoSection: { gap: 4, marginBottom: 6 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  infoText: { flex: 1, fontSize: 13, color: '#555' },

  description: {
    fontSize: 13,
    color: '#777',
    marginTop: 6,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    backgroundColor: '#F0FBF4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  costText: { fontSize: 13, fontWeight: '600', color: '#2D9B4E' },
});
