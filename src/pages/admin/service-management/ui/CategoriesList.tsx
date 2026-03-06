import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../styles';

interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
}

interface CategoriesListProps {
  categories: CategoryItem[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCategoryModal: () => void;
}

export const CategoriesList: React.FC<CategoriesListProps> = ({
  categories,
  loading,
  refreshing,
  onRefresh,
  onOpenCategoryModal,
}) => {
  return (
    <FlatList
      data={categories}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
      contentContainerStyle={[styles.listContainer, categories.length === 0 && styles.emptyList]}
      ListEmptyComponent={(
        <View style={styles.emptyContainer}>
          {loading ? <ActivityIndicator size="large" color="#007AFF" /> : (
            <>
              <Ionicons name="folder-open-outline" size={48} color="#ddd" />
              <Text style={styles.emptyText}>Chưa có danh mục nào</Text>
              <TouchableOpacity style={styles.createFirstCategoryBtn} onPress={onOpenCategoryModal}>
                <Text style={styles.createFirstCategoryText}>Tạo danh mục đầu tiên</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.catCard}>
          <View style={styles.catCardContent}>
            <Text style={styles.catName}>{item.name}</Text>
            {item.description ? <Text style={styles.catDesc}>{item.description}</Text> : null}
          </View>
        </View>
      )}
    />
  );
};
