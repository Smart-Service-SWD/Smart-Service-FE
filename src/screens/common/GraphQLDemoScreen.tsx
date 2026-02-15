import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getServiceCategories, ServiceCategory } from '../../services/graphqlService';

export function GraphQLDemoScreen() {
  const [list, setList] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await getServiceCategories();
      setList(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi gọi API');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GraphQL Demo – getServiceCategories</Text>
      <Text style={styles.subtitle}>BE cổng 5268</Text>
      {loading && list.length === 0 ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.hint}>
            Kiểm tra: (1) BE chạy cổng 5268 (dotnet run), (2) Sửa 5 IP trong src/config/api.config.ts cho đúng mạng, (3) Expo Go trên máy thật phải dùng IP máy tính (vd 192.168.1.26).
          </Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchCategories} />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc}>{item.description || '—'}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có danh mục nào</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  loader: { marginTop: 32 },
  errorBox: { marginTop: 16, padding: 12, backgroundColor: '#ffebee', borderRadius: 8 },
  errorText: { fontSize: 14, color: '#c62828', fontWeight: '600' },
  hint: { fontSize: 12, color: '#666', marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 8,
    marginBottom: 10,
  },
  name: { fontSize: 16, fontWeight: '600' },
  desc: { fontSize: 14, color: '#555', marginTop: 4 },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
});
