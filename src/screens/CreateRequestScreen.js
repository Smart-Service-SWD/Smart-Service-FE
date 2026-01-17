import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { analysisService } from '../services/analysisService';

export const CreateRequestScreen = ({ route, navigation }) => {
  const { analysisId } = route.params || {};
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('Medium');
  const [loading, setLoading] = useState(false);

  const urgencyLevels = ['Low', 'Medium', 'High'];

  const handleCreateRequest = async () => {
    if (!description.trim()) {
      Alert.alert('Validation', 'Please enter a description');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        analysisId,
        description,
        urgency,
        category: 'Service',
      };

      await analysisService.createServiceRequest(requestData);
      
      Alert.alert('Success', 'Service request created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('History'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Describe your service request..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={6}
          value={description}
          onChangeText={setDescription}
          editable={!loading}
        />

        <Text style={styles.label}>Urgency Level</Text>
        <View style={styles.urgencyContainer}>
          {urgencyLevels.map(level => (
            <TouchableOpacity
              key={level}
              style={[
                styles.urgencyButton,
                urgency === level && styles.urgencyButtonActive,
              ]}
              onPress={() => setUrgency(level)}
              disabled={loading}
            >
              <Text
                style={[
                  styles.urgencyButtonText,
                  urgency === level && styles.urgencyButtonTextActive,
                ]}
              >
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleCreateRequest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    marginTop: 8,
  },
  urgencyButtonActive: {
    backgroundColor: '#007AFF',
  },
  urgencyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  urgencyButtonTextActive: {
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
