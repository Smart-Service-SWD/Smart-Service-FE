import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useEffect, useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import {
  analyzeServiceRequest,
  createServiceRequest,
  getServiceCategories,
  ServiceCategory,
  uploadAttachment,
} from '../../services/userService';

export const RequestPage = ({ navigation }: any) => {
  const { user } = useAuth();

  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [files, setFiles] = useState<any[]>([]);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'analyzing'>('form');

  useEffect(() => {
    getServiceCategories()
      .then(setCategories)
      .catch(() => Alert.alert('Lỗi', 'Không tải được danh mục dịch vụ'))
      .finally(() => setCatLoading(false));
  }, []);

  const selectedCategory = categories.find(c => c.id === categoryId);

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, type: '*/*' });
    if (!result.canceled) {
      setFiles(prev => [...prev, ...result.assets]);
    }
  }, []);

  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!categoryId) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn danh mục dịch vụ');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng mô tả yêu cầu dịch vụ');
      return;
    }
    if (!addressText.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập địa chỉ thực hiện dịch vụ');
      return;
    }

    setSubmitting(true);
    setStep('analyzing');

    try {
      const serviceRequest = await createServiceRequest({
        categoryId,
        description: description.trim(),
        addressText: addressText.trim(),
      });

      if (files.length > 0) {
        for (const file of files) {
          try {
            await uploadAttachment(serviceRequest.id, file);
          } catch {
            console.warn('Upload file thất bại:', file.name);
          }
        }
      }

      const analysisResult = await analyzeServiceRequest(serviceRequest.id);

      navigation.navigate('AIReview', {
        serviceRequest,
        analysisResult,
      });
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.message ?? 'Có lỗi xảy ra';
      Alert.alert('Lỗi', msg);
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  const CategoryModal = () => (
    <Modal
      visible={catModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setCatModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn danh mục dịch vụ</Text>
            <TouchableOpacity onPress={() => setCatModalVisible(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catItem, cat.id === categoryId && styles.catItemSelected]}
                onPress={() => { setCategoryId(cat.id); setCatModalVisible(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.catName, cat.id === categoryId && styles.catNameSelected]}>
                    {cat.name}
                  </Text>
                  {!!cat.description && (
                    <Text style={styles.catDesc} numberOfLines={2}>{cat.description}</Text>
                  )}
                </View>
                {cat.id === categoryId && <Ionicons name="checkmark-circle" size={22} color="#2563EB" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (step === 'analyzing') {
    return (
      <View style={styles.analyzingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.analyzingTitle}>Đang phân tích yêu cầu</Text>
        <Text style={styles.analyzingSubtitle}>
          AI đang đánh giá độ phức tạp và ước tính chi phí…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo yêu cầu dịch vụ</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Danh mục dịch vụ *</Text>
        <TouchableOpacity
          style={styles.selectBox}
          onPress={() => setCatModalVisible(true)}
          disabled={catLoading}
        >
          {catLoading ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <>
              <Text style={[styles.selectText, !selectedCategory && styles.placeholder]}>
                {selectedCategory ? selectedCategory.name : 'Chọn danh mục dịch vụ...'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#6B7280" />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Mô tả yêu cầu *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả chi tiết vấn đề bạn gặp phải, tình trạng hiện tại, yêu cầu cụ thể..."
          multiline
          numberOfLines={5}
          placeholderTextColor="#9CA3AF"
          textAlignVertical="top"
        />

        <Text style={styles.label}>Địa chỉ thực hiện dịch vụ *</Text>
        <TextInput
          style={styles.input}
          value={addressText}
          onChangeText={setAddressText}
          placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Tệp đính kèm (tùy chọn)</Text>
        <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
          <Ionicons name="attach" size={20} color="#6B7280" />
          <Text style={styles.fileButtonText}>Chọn ảnh / tài liệu</Text>
        </TouchableOpacity>
        {files.map((file, i) => (
          <View key={i} style={styles.fileItem}>
            <Ionicons name="document-outline" size={18} color="#6B7280" />
            <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
            <TouchableOpacity onPress={() => removeFile(i)}>
              <Ionicons name="close-circle" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
          <Text style={styles.noteText}>
            Sau khi gửi, AI sẽ tự động phân tích yêu cầu và đề xuất mức giá. Bạn có thể chấp nhận,
            yêu cầu đánh giá lại hoặc gửi staff xem xét thủ công.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.submitBtnText}>Gửi yêu cầu & Phân tích AI</Text>
        </TouchableOpacity>
      </ScrollView>

      <CategoryModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  selectBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { fontSize: 15, color: '#111827', flex: 1 },
  placeholder: { color: '#9CA3AF' },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  fileButtonText: { color: '#6B7280', fontSize: 15 },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    gap: 8,
  },
  fileName: { flex: 1, fontSize: 13, color: '#1D4ED8' },
  noteBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 14,
    marginTop: 24,
    gap: 10,
  },
  noteText: { flex: 1, fontSize: 13, color: '#1E40AF', lineHeight: 20 },
  submitBtn: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  analyzingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  analyzingTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginTop: 16 },
  analyzingSubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  catItemSelected: { backgroundColor: '#EFF6FF' },
  catName: { fontSize: 15, fontWeight: '600', color: '#374151' },
  catNameSelected: { color: '#2563EB' },
  catDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
