import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraphqlUser } from '../../shared/api/adminGraphqlService';
import { useAgentManagement } from '../../features/admin/agent-management/model/useAgentManagement';
import { styles } from './member-management/styles';
import { MemberScreenHeader } from './member-management/ui/MemberScreenHeader';
import { MemberSearchBar } from './member-management/ui/MemberSearchBar';
import { MemberCard } from './member-management/ui/MemberCard';
import { CreateMemberModal } from './member-management/ui/CreateMemberModal';

export const AgentManagementScreen: React.FC = () => {
  const {
    users,
    loading,
    refreshing,
    search,
    createVisible,
    creating,
    form,
    setSearch,
    setCreateVisible,
    setForm,
    onRefresh,
    handleCreate,
    toggleLock,
  } = useAgentManagement();

  const renderItem = ({ item }: { item: GraphqlUser }) => (
    <MemberCard item={item} badgePlacement="header" onToggleLock={toggleLock} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <MemberScreenHeader
        title="Quản lý thợ"
        addIcon="hammer-outline"
        onPressAdd={() => setCreateVisible(true)}
      />

      <MemberSearchBar
        value={search}
        placeholder="Tìm thợ..."
        onChangeText={setSearch}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={users.length === 0 ? styles.emptyList : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Không có dữ liệu thợ</Text>
            </View>
          }
        />
      )}

      <CreateMemberModal
        visible={createVisible}
        title="Thêm thợ"
        submitLabel="Tạo"
        creating={creating}
        form={form}
        onClose={() => setCreateVisible(false)}
        onSubmit={handleCreate}
        onChangeForm={updater => setForm(updater)}
      />
    </SafeAreaView>
  );
};
