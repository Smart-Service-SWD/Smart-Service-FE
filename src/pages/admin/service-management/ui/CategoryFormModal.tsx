import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles';

interface CategoryFormModalProps {
  visible: boolean;
  catName: string;
  catDescription: string;
  catCreating: boolean;
  onClose: () => void;
  onCreate: () => void;
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  visible,
  catName,
  catDescription,
  catCreating,
  onClose,
  onCreate,
  onChangeName,
  onChangeDescription,
}) => {
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '55%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tạo danh mục mới</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Tên danh mục *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="VD: Sửa điện, Ô tô, Gia dụng..."
              value={catName}
              onChangeText={onChangeName}
            />
            <Text style={styles.fieldLabel}>Mô tả</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="Mô tả danh mục"
              value={catDescription}
              onChangeText={onChangeDescription}
              multiline
              numberOfLines={3}
            />
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSave, catCreating && styles.btnDisabled]}
              onPress={onCreate}
              disabled={catCreating}
            >
              {catCreating
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.btnSaveText}>Tạo mới</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
