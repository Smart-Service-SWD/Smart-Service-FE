import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GraphqlUser } from '../../../../shared/api/adminGraphqlService';
import { styles } from '../styles';

interface UserDetailModalProps {
  visible: boolean;
  selectedUser: GraphqlUser | null;
  editRoleVisible: boolean;
  newRole: string;
  editableRoleOptions: readonly string[];
  savingRole: boolean;
  onClose: () => void;
  onSelectRole: (role: string) => void;
  onUpdateRole: () => Promise<void>;
  getRoleColor: (role: string) => string;
  getRoleLabel: (role: string) => string;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  visible,
  selectedUser,
  editRoleVisible,
  newRole,
  editableRoleOptions,
  savingRole,
  onClose,
  onSelectRole,
  onUpdateRole,
  getRoleColor,
  getRoleLabel,
}) => {
  if (!selectedUser) {
    return null;
  }

  const currentRoleColor = getRoleColor(selectedUser.role);

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết người dùng</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <Text style={styles.detailLabel}>Họ tên:</Text>
              <Text style={styles.detailValue}>{selectedUser.fullName}</Text>

              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{selectedUser.email}</Text>

              <Text style={styles.detailLabel}>Số điện thoại:</Text>
              <Text style={styles.detailValue}>
                {selectedUser.phoneNumber || 'Chưa có số điện thoại'}
              </Text>

              <Text style={styles.detailLabel}>Vai trò hiện tại:</Text>
              <View style={[styles.roleBadge, styles.currentRoleBadge, { backgroundColor: currentRoleColor + '20' }]}>
                <Text style={[styles.roleText, { color: currentRoleColor }]}>
                  {getRoleLabel(selectedUser.role)}
                </Text>
              </View>

              {editRoleVisible && (
                <>
                  <Text style={styles.detailLabel}>Thay đổi vai trò:</Text>
                  <View style={styles.roleChipsRow}>
                    {editableRoleOptions.map(role => {
                      const roleColor = getRoleColor(role);
                      const isActive = newRole === role;

                      return (
                        <TouchableOpacity
                          key={role}
                          style={[
                            styles.roleChip,
                            isActive && {
                              backgroundColor: roleColor,
                              borderColor: roleColor,
                            },
                          ]}
                          onPress={() => onSelectRole(role)}
                        >
                          <Text style={[styles.roleChipText, isActive && styles.roleChipActiveText]}>
                            {getRoleLabel(role)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.btnSaveRole,
                      savingRole && styles.btnSaveRoleDisabled,
                    ]}
                    onPress={onUpdateRole}
                    disabled={savingRole}
                  >
                    {savingRole
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.btnSaveRoleText}>Lưu vai trò</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
