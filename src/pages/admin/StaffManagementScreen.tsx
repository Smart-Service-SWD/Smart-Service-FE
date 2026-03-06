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
import { useStaffManagement } from '../../features/admin/staff-management/model/useStaffManagement';
import { styles } from './member-management/styles';
import { MemberScreenHeader } from './member-management/ui/MemberScreenHeader';
import { MemberSearchBar } from './member-management/ui/MemberSearchBar';
import { MemberCard } from './member-management/ui/MemberCard';
import { CreateMemberModal } from './member-management/ui/CreateMemberModal';

export const StaffManagementScreen: React.FC = () => {
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
  } = useStaffManagement();

  const renderItem = ({ item }: { item: GraphqlUser }) => (
    <MemberCard item={item} badgePlacement="footer" onToggleLock={toggleLock} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <MemberScreenHeader
        title="Quản lý nhân viên"
        addIcon="person-add-outline"
        onPressAdd={() => setCreateVisible(true)}
      />

      <MemberSearchBar
        value={search}
        placeholder="Tìm nhân viên..."
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
              <Text style={styles.emptyText}>Không có dữ liệu nhân viên</Text>
            </View>
          }
        />
      )}

      <CreateMemberModal
        visible={createVisible}
        title="Thêm nhân viên"
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
