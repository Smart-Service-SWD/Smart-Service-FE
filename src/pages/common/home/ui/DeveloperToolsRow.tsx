import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../home.styles';

interface DeveloperToolsRowProps {
  onOpenGraphQlDemo: () => void;
  onTestToast: () => void;
}

export const DeveloperToolsRow: React.FC<DeveloperToolsRowProps> = ({
  onOpenGraphQlDemo,
  onTestToast,
}) => {
  return (
    <View style={styles.devToolsRow}>
      <TouchableOpacity
        style={[styles.graphqlDemoCard, styles.devToolCard]}
        onPress={onOpenGraphQlDemo}
        activeOpacity={0.8}
      >
        <Ionicons name="code-slash" size={20} color="#007AFF" />
        <Text style={[styles.graphqlDemoText, styles.devToolText]}>GraphQL</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.graphqlDemoCard, styles.devToolCard, styles.devToolSuccessCard]}
        onPress={onTestToast}
        activeOpacity={0.8}
      >
        <Ionicons name="notifications-outline" size={20} color="#10B981" />
        <Text style={[styles.graphqlDemoText, styles.devToolText, styles.devToolSuccessText]}>
          Test Toast
        </Text>
      </TouchableOpacity>
    </View>
  );
};
