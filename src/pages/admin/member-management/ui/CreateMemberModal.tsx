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

interface MemberForm {
  fullName: string;
  email: string;
  phoneNumber: string;
}

interface CreateMemberModalProps {
  visible: boolean;
  title: string;
  submitLabel: string;
  creating: boolean;
  form: MemberForm;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onChangeForm: (updater: (previous: MemberForm) => MemberForm) => void;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  visible,
  title,
  submitLabel,
  creating,
  form,
  onClose,
  onSubmit,
  onChangeForm,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.input}
            placeholder="Họ tên"
            value={form.fullName}
            onChangeText={fullName => onChangeForm(previous => ({ ...previous, fullName }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            onChangeText={email => onChangeForm(previous => ({ ...previous, email }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
            value={form.phoneNumber}
            onChangeText={phoneNumber => onChangeForm(previous => ({ ...previous, phoneNumber }))}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, creating && styles.saveBtnDisabled]}
              onPress={onSubmit}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveText}>{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
