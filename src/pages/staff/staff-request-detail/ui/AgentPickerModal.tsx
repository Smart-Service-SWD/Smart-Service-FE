import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServiceAgent } from '../../../../shared/api/staffGraphqlService';
import { styles } from '../styles';

interface AgentPickerModalProps {
  visible: boolean;
  agents: ServiceAgent[];
  selectedAgentId: string;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
}

export const AgentPickerModal: React.FC<AgentPickerModalProps> = ({
  visible,
  agents,
  selectedAgentId,
  onClose,
  onSelectAgent,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn nhà cung cấp</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {agents
              .filter(agent => agent.isActive)
              .map(agent => {
                const isSelected = selectedAgentId === agent.id;
                return (
                  <TouchableOpacity
                    key={agent.id}
                    style={[styles.agentItem, isSelected && styles.agentItemSelected]}
                    onPress={() => onSelectAgent(agent.id)}
                  >
                    <View style={styles.agentAvatar}>
                      <Text style={styles.agentAvatarText}>
                        {agent.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agentItemName}>{agent.fullName}</Text>
                      <Text style={styles.agentItemSub}>
                        {agent.capabilities.length} kỹ năng &bull; Đang hoạt động
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={22} color="#1976D2" />
                    )}
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
