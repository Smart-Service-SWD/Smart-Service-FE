import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COMPLEXITY_LABEL } from '../../../../features/staff/request-detail/model/constants';
import { styles } from '../styles';

interface ComplexityModalProps {
  visible: boolean;
  selectedLevel: number;
  submitting: boolean;
  onClose: () => void;
  onSelectLevel: (level: number) => void;
  onSubmit: () => void;
}

export const ComplexityModal: React.FC<ComplexityModalProps> = ({
  visible,
  selectedLevel,
  submitting,
  onClose,
  onSelectLevel,
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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Đánh giá độ phức tạp</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {[1, 2, 3, 4, 5].map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.complexityItem,
                selectedLevel === level && styles.complexityItemSelected,
              ]}
              onPress={() => onSelectLevel(level)}
            >
              <Text
                style={[
                  styles.complexityItemText,
                  selectedLevel === level && { color: '#1976D2', fontWeight: '700' },
                ]}
              >
                {level} - {COMPLEXITY_LABEL[level]}
              </Text>
              {selectedLevel === level && (
                <Ionicons name="checkmark" size={20} color="#1976D2" />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.approveBtn, { marginTop: 12 }, submitting && { opacity: 0.7 }]}
            onPress={onSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.approveBtnText}>Cập nhật</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
