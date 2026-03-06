import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';
import { ServiceRequestDetail } from '../../shared/api/userService';
import { useMyRequests } from '../../features/user/my-requests/model/useMyRequests';
import { styles } from './my-requests/styles';
import { MyRequestsHeader } from './my-requests/ui/MyRequestsHeader';
import { RequestFilterTabs } from './my-requests/ui/RequestFilterTabs';
import { RequestCard } from './my-requests/ui/RequestCard';
import { EmptyRequestsState } from './my-requests/ui/EmptyRequestsState';

interface Props {
  navigation: any;
}

export const MyRequestsScreen: React.FC<Props> = ({ navigation }) => {
  const {
    requests,
    loading,
    refreshing,
    filter,
    setFilter,
    onRefresh,
  } = useMyRequests();

  const handleItemPress = (item: ServiceRequestDetail) => {
    navigation.navigate('RequestDetail', { requestId: item.id });
  };

  return (
    <View style={styles.container}>
      <MyRequestsHeader onCreateRequest={() => navigation.navigate('NewRequest')} />

      <RequestFilterTabs filter={filter} onChangeFilter={setFilter} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <RequestCard item={item} onPress={handleItemPress} />}
          contentContainerStyle={requests.length === 0 ? { flex: 1 } : { padding: 16, paddingBottom: 32 }}
          ListEmptyComponent={(
            <EmptyRequestsState
              hasFilter={!!filter}
              onCreateRequest={() => navigation.navigate('NewRequest')}
            />
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </View>
  );
};
