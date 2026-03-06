import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../styles';

interface StaffReviewModalProps {
  visible: boolean;
  note: string;
  sending: boolean;
  onClose: () => void;
  onChangeNote: (value: string) => void;
  onSubmit: () => void;
}

export const StaffReviewModal: React.FC<StaffReviewModalProps> = ({
  visible,
  note,
  sending,
  onClose,
  onChangeNote,
  onSubmit,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalTitle}>Gửi cho nhân viên xem xét</Text>
          <Text style={styles.modalSubtitle}>
            Nhân viên sẽ đánh giá lại thủ công yêu cầu của bạn. Bạn có thể thêm ghi chú
            (tùy chọn).
          </Text>
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={onChangeNote}
            placeholder="VD: Giá ước tính quá cao, tôi muốn được đánh giá lại..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalBtnCancel}
              onPress={onClose}
              disabled={sending}
            >
              <Text style={styles.modalBtnCancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalBtnConfirm, sending && { opacity: 0.6 }]}
              onPress={onSubmit}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.modalBtnConfirmText}>Gửi</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
