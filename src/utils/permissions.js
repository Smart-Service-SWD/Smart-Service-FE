import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Request camera permissions using image picker
export const requestCameraPermission = async () => {
  // Camera access is requested through image picker
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Denied',
      'Camera permission is required to use this feature',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

// Request image picker permissions
export const requestImagePickerPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission Denied',
      'Photo library permission is required',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

// Pick image from library
export const pickImageFromLibrary = async () => {
  try {
    const hasPermission = await requestImagePickerPermission();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.cancelled) {
      return result.uri;
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};
