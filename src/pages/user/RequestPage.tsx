import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRequestPage } from '../../features/user/request/model/useRequestPage';
import { styles } from './request/styles';

export const RequestPage = ({ navigation, route }: any) => {
  const preSelectedService = route?.params?.service;
  const preSelectedCategoryId = route?.params?.categoryId;

  const {
    categoryId,
    description,
    addressText,
    files,
    categories,
    catLoading,
    catModalVisible,
    submitting,
    step,
    selectedCategory,
    setCategoryId,
    setDescription,
    setAddressText,
    setCatModalVisible,
    pickFile,
    removeFile,
    handleSubmit,
  } = useRequestPage({
    navigation,
    preSelectedCategoryId,
    preSelectedService,
  });

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
