import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
  analyzeServiceRequest,
  createServiceRequest,
  getServiceCategories,
  ServiceCategory,
  uploadAttachment,
} from '../../../../shared/api/userService';

interface UseRequestPageParams {
  navigation: any;
  preSelectedCategoryId?: string;
  preSelectedService?: any;
}

export const useRequestPage = ({
  navigation,
  preSelectedCategoryId,
  preSelectedService,
}: UseRequestPageParams) => {
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'analyzing'>('form');

  useEffect(() => {
    const init = async () => {
      try {
        const loadedCategories = await getServiceCategories();
        setCategories(loadedCategories);

        if (preSelectedCategoryId) {
          setCategoryId(preSelectedCategoryId);
        } else if (preSelectedService) {
          const matchingCategory = loadedCategories.find(
            category =>
              category.name === preSelectedService.categoryName ||
              category.name === preSelectedService.category
          );
          if (matchingCategory) {
            setCategoryId(matchingCategory.id);
          }
        }
      } catch {
        Alert.alert('Loi', 'Khong tai duoc danh muc dich vu');
      } finally {
        setCatLoading(false);
      }
    };

    init();
  }, [preSelectedCategoryId, preSelectedService]);

  const selectedCategory = useMemo(
    () => categories.find(category => category.id === categoryId),
    [categories, categoryId]
  );

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ multiple: true, type: '*/*' });
    if (!result.canceled) {
      setFiles(previousFiles => [...previousFiles, ...result.assets]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(previousFiles => previousFiles.filter((_, itemIndex) => itemIndex !== index));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!categoryId) {
      Alert.alert('Thieu thong tin', 'Vui long chon danh muc dich vu');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Thieu thong tin', 'Vui long mo ta yeu cau dich vu');
      return;
    }
    if (!addressText.trim()) {
      Alert.alert('Thieu thong tin', 'Vui long nhap dia chi thuc hien dich vu');
      return;
    }

    setSubmitting(true);
    setStep('analyzing');

    try {
      const serviceRequest = await createServiceRequest({
        categoryId,
        description: description.trim(),
        addressText: addressText.trim(),
      });

      if (files.length > 0) {
        for (const file of files) {
          try {
            await uploadAttachment(serviceRequest.id, file);
          } catch {
            console.warn('Upload file that bai:', file.name);
          }
        }
      }

      const analysisResult = await analyzeServiceRequest(description.trim());

      navigation.navigate('AIReview', {
        serviceRequest,
        analysisResult,
      });
    } catch (errorResponse: any) {
      const message = errorResponse?.response?.data?.message ?? errorResponse?.message ?? 'Co loi xay ra';
      Alert.alert('Loi', message);
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  }, [addressText, categoryId, description, files, navigation]);

  return {
    categoryId,
    description,
    addressText,
    files,
    categories,
    catLoading,
    catModalVisible,
    submitting,
    step,
    selectedCategory,
    setCategoryId,
    setDescription,
    setAddressText,
    setCatModalVisible,
    pickFile,
    removeFile,
    handleSubmit,
  };
};
