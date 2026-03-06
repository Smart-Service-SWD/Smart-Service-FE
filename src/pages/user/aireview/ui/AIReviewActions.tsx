import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../styles';

interface AIReviewActionsProps {
  reanalyzing: boolean;
  onAccept: () => void;
  onReAnalyze: () => void;
  onOpenStaffModal: () => void;
}

export const AIReviewActions: React.FC<AIReviewActionsProps> = ({
  reanalyzing,
  onAccept,
  onReAnalyze,
  onOpenStaffModal,
}) => {
  if (reanalyzing) {
    return (
      <View style={styles.reanalyzingBox}>
        <ActivityIndicator color="#3B82F6" />
        <Text style={styles.reanalyzingText}>Đang phân tích lại…</Text>
      </View>
    );
  }

  return (
    <View style={styles.actions}>
      <TouchableOpacity style={styles.btnAccept} onPress={onAccept}>
        <Ionicons name="checkmark-circle" size={20} color="#fff" />
        <Text style={styles.btnText}>Chấp nhận</Text>
      </TouchableOpacity>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnReanalyze} onPress={onReAnalyze}>
          <Ionicons name="refresh" size={18} color="#3B82F6" />
          <Text style={styles.btnReanalyzeText}>Đánh giá lại</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnStaff} onPress={onOpenStaffModal}>
          <Ionicons name="people-outline" size={18} color="#F59E0B" />
          <Text style={styles.btnStaffText}>Gửi staff</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
