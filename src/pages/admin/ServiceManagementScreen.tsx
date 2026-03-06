import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useServiceManagement } from '../../features/admin/service-management/model/useServiceManagement';
import { ServiceFormModal } from './service-management/ui/ServiceFormModal';
import { CategoryFormModal } from './service-management/ui/CategoryFormModal';
import { styles } from './service-management/styles';
import { ServiceManagementHeader } from './service-management/ui/ServiceManagementHeader';
import { ServiceManagementTabs } from './service-management/ui/ServiceManagementTabs';
import { ServiceSearchFilters } from './service-management/ui/ServiceSearchFilters';
import { CategoriesList } from './service-management/ui/CategoriesList';
import { ServicesList } from './service-management/ui/ServicesList';

export const ServiceManagementScreen: React.FC = () => {
  const {
    categories,
    activeTab,
    searchQuery,
    selectedCategory,
    refreshing,
    loading,
    saving,
    modalVisible,
    isAddMode,
    form,
    catModalVisible,
    catName,
    catDescription,
    catCreating,
    filteredServices,
    categoryFilters,
    setActiveTab,
    setSearchQuery,
    setSelectedCategory,
    setForm,
    setCatModalVisible,
    setCatName,
    setCatDescription,
    onRefresh,
    openAddModal,
    openEditModal,
    closeModal,
    handleCreateCategory,
    handleSave,
    handleDelete,
    formatCurrency,
    formatDuration,
  } = useServiceManagement();

  return (
    <SafeAreaView style={styles.container}>
      <ServiceManagementHeader
        activeTab={activeTab}
        onOpenAddService={openAddModal}
        onOpenAddCategory={() => setCatModalVisible(true)}
      />

      <ServiceManagementTabs
        activeTab={activeTab}
        categoriesCount={categories.length}
        onChangeTab={setActiveTab}
      />

      {activeTab === 'services' && (
        <ServiceSearchFilters
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          categoryFilters={categoryFilters as string[]}
          onChangeSearch={setSearchQuery}
          onSelectCategory={setSelectedCategory}
        />
      )}

      {activeTab === 'categories' && (
        <CategoriesList
          categories={categories}
          loading={loading}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onOpenCategoryModal={() => setCatModalVisible(true)}
        />
      )}

      {activeTab === 'services' && (
        <ServicesList
          services={filteredServices}
          loading={loading}
          refreshing={refreshing}
          searchQuery={searchQuery}
          onRefresh={onRefresh}
          formatCurrency={formatCurrency}
          formatDuration={formatDuration}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      <ServiceFormModal
        visible={modalVisible}
        isAddMode={isAddMode}
        saving={saving}
        form={form}
        categories={categories}
        onClose={closeModal}
        onSave={handleSave}
        onOpenCategoryCreator={() => setCatModalVisible(true)}
        onSwitchToCategoriesTab={() => setActiveTab('categories')}
        onChangeForm={updater => setForm(updater)}
      />

      <CategoryFormModal
        visible={catModalVisible}
        catName={catName}
        catDescription={catDescription}
        catCreating={catCreating}
        onClose={() => setCatModalVisible(false)}
        onCreate={handleCreateCategory}
        onChangeName={setCatName}
        onChangeDescription={setCatDescription}
      />
    </SafeAreaView>
  );
};
