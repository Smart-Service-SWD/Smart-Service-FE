import React, { useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert, ActivityIndicator } from 'react-native';
import { CameraView } from 'expo-camera';
import { useAnalysis } from '../context/AnalysisContext';

export const CameraScreen: React.FC<{ navigation  }> = ({ navigation  }) => {
  const cameraRef = useRef(null);
  const { analyze, loading } = useAnalysis();
  const [facing, setFacing] = useState<string>('back');

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        await handleAnalyze(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture: ' + error.message);
      }
    }
  };

  const handleAnalyze = async (imageUri) => {
    try {
      const result = await analyze(imageUri, {
        description: 'Captured from camera',
      });
      navigation.navigate('AnalysisResult', { analysis: result });
    } catch (error) {
      Alert.alert('Analysis Error', error.message || 'Failed to analyze image');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing image...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing as any} ref={cameraRef}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={toggleCameraFacing}
          >
            <Text style={styles.buttonText}>⚡ Flip</Text>
          </TouchableOpacity>
        </View>
      </CameraView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.captureButton} 
          onPress={takePicture}
          disabled={loading}
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
        <Text style={styles.hint}>Chụp ảnh để phân tích</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  controlsContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: 30,
    paddingRight: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomContainer: {
    backgroundColor: '#1a1a1a',
    paddingVertical: 20,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
  },
  hint: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});
