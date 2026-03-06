import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceAgent } from '../../../../shared/api/staffGraphqlService';
import { styles } from '../styles';

interface ApprovalCardProps {
  isPendingReview: boolean;
  selectedAgent: ServiceAgent | undefined;
  estimatedAmount: string;
  submitting: boolean;
  onOpenAgentPicker: () => void;
  onChangeEstimatedAmount: (value: string) => void;
  onOpenComplexityModal: () => void;
  onApprove: () => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  isPendingReview,
  selectedAgent,
  estimatedAmount,
  submitting,
  onOpenAgentPicker,
  onChangeEstimatedAmount,
  onOpenComplexityModal,
  onApprove,
}) => {
  if (!isPendingReview) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Phê duyệt yêu cầu</Text>

      <Text style={styles.fieldLabel}>Nhà cung cấp được chọn *</Text>
      <TouchableOpacity
        style={styles.pickerBtn}
        onPress={onOpenAgentPicker}
      >
        <Ionicons name="person-outline" size={18} color="#1976D2" />
        <Text style={styles.pickerBtnText}>
          {selectedAgent ? selectedAgent.fullName : 'Chọn nhà cung cấp...'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#666" />
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Chi phí ước tính (VND) *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập chi phí ước tính..."
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={estimatedAmount}
        onChangeText={onChangeEstimatedAmount}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.complexityBtn}
          onPress={onOpenComplexityModal}
        >
          <Ionicons name="layers-outline" size={18} color="#FF9800" />
          <Text style={styles.complexityBtnText}>Đánh giá lại độ phức tạp</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.approveBtn, submitting && { opacity: 0.7 }]}
        onPress={onApprove}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.approveBtnText}>Phê duyệt &amp; Phân công</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};
