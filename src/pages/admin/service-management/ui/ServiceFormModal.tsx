import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceCategory } from '../../../../shared/api/adminGraphqlService';
import { ServiceForm } from '../../../../features/admin/service-management/model/types';
import { styles } from '../styles';

interface ServiceFormModalProps {
  visible: boolean;
  isAddMode: boolean;
  saving: boolean;
  form: ServiceForm;
  categories: ServiceCategory[];
  onClose: () => void;
  onSave: () => void;
  onOpenCategoryCreator: () => void;
  onSwitchToCategoriesTab: () => void;
  onChangeForm: (updater: (previous: ServiceForm) => ServiceForm) => void;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  visible,
  isAddMode,
  saving,
  form,
  categories,
  onClose,
  onSave,
  onOpenCategoryCreator,
  onSwitchToCategoriesTab,
  onChangeForm,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isAddMode ? 'Thêm dịch vụ mới' : 'Chỉnh sửa dịch vụ'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Tên dịch vụ *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Nhập tên dịch vụ"
              value={form.name}
              onChangeText={value => onChangeForm(previous => ({ ...previous, name: value }))}
            />

            <Text style={styles.fieldLabel}>Mô tả</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              placeholder="Nhập mô tả dịch vụ"
              value={form.description}
              onChangeText={value => onChangeForm(previous => ({ ...previous, description: value }))}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.fieldLabel}>Danh mục *</Text>
            {categories.length === 0 ? (
              <TouchableOpacity
                style={styles.catEmptyHint}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    onSwitchToCategoriesTab();
                    onOpenCategoryCreator();
                  }, 300);
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color="#007AFF" />
                <Text style={{ color: '#007AFF', marginLeft: 6, fontSize: 13 }}>
                  Chưa có danh mục - nhấn để tạo
                </Text>
              </TouchableOpacity>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[styles.catChip, form.categoryId === category.id && styles.catChipActive]}
                      onPress={() => onChangeForm(previous => ({ ...previous, categoryId: category.id }))}
                    >
                      <Text style={[styles.catChipText, form.categoryId === category.id && styles.catChipTextActive]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}

            <Text style={styles.fieldLabel}>Giá cơ bản (VNĐ) *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="VD: 150000"
              value={form.basePrice}
              onChangeText={value => onChangeForm(previous => ({ ...previous, basePrice: value }))}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Thời gian ước tính (phút) *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="VD: 60"
              value={form.estimatedDuration}
              onChangeText={value => onChangeForm(previous => ({ ...previous, estimatedDuration: value }))}
              keyboardType="numeric"
            />

            {!isAddMode && (
              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Đang hoạt động</Text>
                <Switch
                  value={form.isActive}
                  onValueChange={value => onChangeForm(previous => ({ ...previous, isActive: value }))}
                  trackColor={{ false: '#E0E0E0', true: '#34C75960' }}
                  thumbColor={form.isActive ? '#34C759' : '#9E9E9E'}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnSave, saving && styles.btnDisabled]}
              onPress={onSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.btnSaveText}>{isAddMode ? 'Tạo mới' : 'Lưu'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
