import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StepHeader } from '../components/StepHeader';

export const RequestPage = ({ navigation }: any) => {
  const InputGroup = ({ label, placeholder, multiline = false }: any) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
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
        <InputGroup label="Yêu cầu" />
        <InputGroup label="Mô tả" multiline />

        {/* File Attachment */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>File đính kèm</Text>
          <TouchableOpacity style={styles.fileButton}>
            <Ionicons name="cloud-upload-outline" size={20} color="#666" />
            <Text style={styles.fileButtonText}>Chọn file...</Text>
          </TouchableOpacity>
        </View>

        <InputGroup label="Địa chỉ" />
        <InputGroup label="Số điện thoại" />

        {/* AI Analysis Box */}
        <View style={styles.aiSection}>
          <Text style={styles.sectionTitle}>Yêu cầu AI đánh giá</Text>
          <View style={styles.aiBox}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Độ phức tạp</Text>
              <Text style={styles.rowValue}>Cao</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Suggest</Text>
              <Text style={styles.italicText}>...</Text>
            </View>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={[styles.btn, styles.btnApply]}
            onPress={() => navigation.navigate('Payment')}
          >
            <Text style={styles.btnText}>Apply</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, styles.btnCancel]}
            onPress={() => navigation.goBack()}
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
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
