import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StepHeader } from '../../components/toast/StepHeader';

export const RequestPage = ({ navigation }: any) => {
  const [request, setRequest] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [files, setFiles] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState({ complexity: '', suggest: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const analyzeRequest = async () => {
    if (!request.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập yêu cầu');
      return;
    }
    setAiLoading(true);
    try {
      const response = await fetch('/api/service-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: request }),
      });
      const data = await response.json();
      setDescription(data.description || '');
      setAiAnalysis({
        complexity: data.complexity || 'Trung bình',
        suggest: data.suggest || '...'
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể phân tích yêu cầu');
    } finally {
      setAiLoading(false);
    }
  };

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      type: '*/*',
    });
    if (!result.canceled) {
      setFiles(prev => [...prev, ...result.assets]);
    }
  }, []);

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadAttachments = async () => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const response = await fetch(file.uri);
      const blob = await response.blob();
      formData.append('files', blob, file.name);
    }
    const response = await fetch('/api/service-attachments', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const data = await response.json();
    return data.attachment_ids || [];
  };

  const submitRequest = async () => {
    if (!request || !address || !phone) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const attachmentIds = await uploadAttachments();
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request,
          description,
          address,
          phone,
          attachments: attachmentIds,
          ai_analysis: aiAnalysis,
        }),
      });
      if (response.ok) {
        Alert.alert('Thành công', 'Tạo yêu cầu thành công!');
        navigation.navigate('Payment');
      } else {
        Alert.alert('Lỗi', 'Tạo yêu cầu thất bại');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không kết nối được server');
    } finally {
      setLoading(false);
    }
  };

  const InputGroup = ({ label, value, onChange, placeholder, multiline = false }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        placeholderTextColor="#999"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StepHeader step={1} title="Request" />
      
      <ScrollView contentContainerStyle={styles.content}>
        <InputGroup 
          label="Yêu cầu" 
          value={request}
          onChange={setRequest}
          placeholder="Nhập yêu cầu dịch vụ..."
        />
        
        {aiLoading ? (
          <View style={styles.aiSection}>
            <Text>Đang phân tích...</Text>
          </View>
        ) : (
          !!request && (
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzeRequest}>
              <Text style={styles.analyzeButtonText}>Phân tích AI</Text>
            </TouchableOpacity>
          )
        )}

        <InputGroup 
          label="Mô tả" 
          value={description}
          onChange={setDescription}
          placeholder="Mô tả chi tiết..."
          multiline 
        />

        {/* File Attachment */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>File đính kèm ({files.length})</Text>
          <TouchableOpacity style={styles.fileButton} onPress={pickFile}>
            <Ionicons name="cloud-upload-outline" size={20} color="#666" />
            <Text style={styles.fileButtonText}>Chọn file...</Text>
          </TouchableOpacity>
          {files.map((file, index) => (
            <View key={index} style={styles.fileItem}>
              <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => removeFile(index)}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <InputGroup 
          label="Địa chỉ" 
          value={address}
          onChange={setAddress}
          placeholder="Nhập địa chỉ..."
        />
        <InputGroup 
          label="Số điện thoại" 
          value={phone}
          onChange={setPhone}
          placeholder="Nhập số điện thoại..."
        />

        {/* AI Analysis Box */}
        {Object.values(aiAnalysis).some(v => v) && (
          <View style={styles.aiSection}>
            <Text style={styles.sectionTitle}>AI Analysis</Text>
            <View style={styles.aiBox}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Độ phức tạp</Text>
                <Text style={styles.rowValue}>{aiAnalysis.complexity}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Gợi ý</Text>
                <Text style={styles.italicText}>{aiAnalysis.suggest}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnApply, loading && styles.btnDisabled]}
            onPress={submitRequest}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Đang gửi...' : 'Apply'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnCancel]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.btnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 40 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#E5E7EB', borderRadius: 6, padding: 12, color: '#000' },
  textArea: { height: 80, textAlignVertical: 'top' },
  fileButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB',
    padding: 12, borderRadius: 6
  },
  fileButtonText: { marginLeft: 8, color: '#6B7280' },
  fileItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F3F4F6', padding: 8, borderRadius: 4, marginTop: 4
  },
  fileName: { flex: 1, marginRight: 8, fontSize: 14 },
  analyzeButton: {
    backgroundColor: '#10B981', padding: 12, borderRadius: 6, alignItems: 'center', marginBottom: 16
  },
  analyzeButtonText: { color: '#fff', fontWeight: 'bold' },
  aiSection: { marginTop: 8, marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  aiBox: { backgroundColor: '#E5E7EB', padding: 16, borderRadius: 6, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, color: '#000' },
  rowValue: { fontWeight: 'bold', color: '#000' },
  italicText: { fontStyle: 'italic', color: '#6B7280' },
  buttonGroup: { flexDirection: 'row', gap: 16 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  btnApply: { backgroundColor: '#2563EB' },
  btnCancel: { backgroundColor: '#DC2626' },
  btnDisabled: { backgroundColor: '#9CA3AF' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
