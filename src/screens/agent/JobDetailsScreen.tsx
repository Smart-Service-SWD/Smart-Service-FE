import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { staffGraphqlService } from '../../services/staffGraphqlService';

export const JobDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const passedJob = route.params?.job;
  const jobId = route.params?.jobId || passedJob?.serviceRequestId || passedJob?.id;

  const [requestDetail, setRequestDetail] = useState<any>(passedJob?.requestDetail ?? null);
  const [loading, setLoading] = useState(!passedJob?.requestDetail);
  const [error, setError] = useState('');

  const fetchJobData = useCallback(async () => {
    if (!jobId) {
      setError('Không có ID công việc');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await staffGraphqlService.getRequestDetail(jobId);
      setRequestDetail(data);
    } catch (err: any) {
      setError(err?.message ?? 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!requestDetail) {
      fetchJobData();
    }
  }, [fetchJobData, requestDetail]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !requestDetail) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error || 'Không có dữ liệu'}</Text>
        <TouchableOpacity onPress={fetchJobData} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết công việc</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mô tả chi tiết</Text>
          <Text style={styles.detailText}>{requestDetail.description || 'Không có mô tả'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tệp đính kèm ({requestDetail.attachments?.length || 0})</Text>
          {(requestDetail.attachments || []).map((attachment: any) => (
            <View key={attachment.id} style={styles.fileItem}>
              <Ionicons name="document-outline" size={20} color="#007AFF" />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{attachment.fileName}</Text>
                <Text style={styles.fileType}>
                  {attachment.type} • {new Date(attachment.uploadedAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          ))}
          {(!requestDetail.attachments || requestDetail.attachments.length === 0) && (
            <Text style={styles.emptyAttachments}>Không có tệp đính kèm</Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.acceptButton}
        onPress={() => Alert.alert('Thông báo', 'Flow nhận/từ chối assignment sẽ được bổ sung theo API command mới.')}
      >
        <Text style={styles.acceptButtonText}>NHẬN VIỆC</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  scrollView: { flex: 1, padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  detailText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  fileItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  fileInfo: { flex: 1, marginLeft: 10 },
  fileName: { fontSize: 14, color: '#1D4ED8', fontWeight: '500' },
  fileType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyAttachments: { color: '#9CA3AF', fontSize: 13 },
  acceptButton: {
    backgroundColor: '#14A800',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptButtonText: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#D32F2F', marginBottom: 12 },
  retryButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600' },
});

export default JobDetailsScreen;
