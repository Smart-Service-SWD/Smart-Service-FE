import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './styles';

interface EditProfileModalProps {
  visible: boolean;
  title?: string;
  name: string;
  phone: string;
  saving: boolean;
  primaryColor: string;
  onClose: () => void;
  onChangeName: (value: string) => void;
  onChangePhone: (value: string) => void;
  onSave: () => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  title = 'Chỉnh sửa hồ sơ',
  name,
  phone,
  saving,
  primaryColor,
  onClose,
  onChangeName,
  onChangePhone,
  onSave,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{title}</Text>

            <Text style={styles.fieldLabel}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={onChangeName}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#aaa"
            />

            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={onChangePhone}
              placeholder="Nhập số điện thoại"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={onClose} disabled={saving}>
                <Text style={styles.btnCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, { backgroundColor: primaryColor }, saving && { opacity: 0.6 }]}
                onPress={onSave}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnSaveText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
