import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserManagement } from '../../features/admin/user-management/model/useUserManagement';
import { GraphqlUser } from '../../shared/api/adminGraphqlService';
import { styles } from './user-management/styles';
import { UserManagementFilters } from './user-management/ui/UserManagementFilters';
import { UserCard } from './user-management/ui/UserCard';
import { UserDetailModal } from './user-management/ui/UserDetailModal';

export const UserManagementScreen: React.FC = () => {
  const {
    users,
    searchQuery,
    selectedRole,
    refreshing,
    modalVisible,
    selectedUser,
    loading,
    savingRole,
    editRoleVisible,
    newRole,
    roleOptions,
    editableRoleOptions,
    getRoleColor,
    getRoleLabel,
    setSearchQuery,
    setSelectedRole,
    setNewRole,
    onRefresh,
    closeModal,
    openUserDetail,
    handleUpdateRole,
    handleUserAction,
  } = useUserManagement();

  const renderUserItem = ({ item }: { item: GraphqlUser }) => {
    return (
      <UserCard
        item={item}
        getRoleColor={getRoleColor}
        getRoleLabel={getRoleLabel}
        onOpenUserDetail={openUserDetail}
        onAction={handleUserAction}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <UserManagementFilters
        searchQuery={searchQuery}
        selectedRole={selectedRole}
        roleOptions={roleOptions}
        onChangeSearch={setSearchQuery}
        onSelectRole={setSelectedRole}
        getRoleLabel={getRoleLabel}
      />

      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading
              ? <ActivityIndicator size="large" color="#007AFF" />
              : (
                <>
                  <Ionicons name="people-outline" size={48} color="#ddd" />
                  <Text style={styles.emptyText}>Không tìm thấy người dùng nào</Text>
                </>
              )
            }
          </View>
        }
      />

      <UserDetailModal
        visible={modalVisible}
        selectedUser={selectedUser}
        editRoleVisible={editRoleVisible}
        newRole={newRole}
        editableRoleOptions={editableRoleOptions}
        savingRole={savingRole}
        onClose={closeModal}
        onSelectRole={setNewRole}
        onUpdateRole={handleUpdateRole}
        getRoleColor={getRoleColor}
        getRoleLabel={getRoleLabel}
      />
    </SafeAreaView>
  );
};
