import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  SERVICE_CATEGORIES_QUERY,
  SERVICE_DEFINITIONS_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatCurrency } from "../../../shared/utils/format";
import type { ServiceCategory, ServiceDefinition } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import {
  createCategory,
  createServiceDefinition,
  deleteServiceDefinition,
  updateServiceDefinition
} from "../api/adminApi";

interface CategoryResponse {
  getServiceCategories: ServiceCategory[];
}

interface ServiceResponse {
  getServiceDefinitions: ServiceDefinition[];
}

export default function ServiceAdminScreen() {
  const { session } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [basePrice, setBasePrice] = useState("100000");
  const [estimatedDuration, setEstimatedDuration] = useState("60");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const loadData = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [categoryData, serviceData] = await Promise.all([
        graphqlRequest<CategoryResponse>(SERVICE_CATEGORIES_QUERY),
        graphqlRequest<ServiceResponse>(SERVICE_DEFINITIONS_QUERY)
      ]);
      setCategories(categoryData.getServiceCategories);
      setServices(serviceData.getServiceDefinitions);
      if (!selectedCategoryId && categoryData.getServiceCategories.length > 0) {
        setSelectedCategoryId(categoryData.getServiceCategories[0].id);
      }
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (!selectedService) {
      return;
    }
    setServiceName(selectedService.name);
    setServiceDescription(selectedService.description ?? "");
    setBasePrice(String(selectedService.basePrice));
    setEstimatedDuration(String(selectedService.estimatedDuration));
    setIsActive(selectedService.isActive);
  }, [selectedService]);

  const handleCreateCategory = async () => {
    if (!session) {
      return;
    }
    if (!categoryName.trim()) {
      setError("Category name is required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const id = await createCategory(session.accessToken, {
        name: categoryName.trim(),
        description: categoryDescription.trim()
      });
      setSuccess(`Category created: ${id}`);
      setCategoryName("");
      setCategoryDescription("");
      await loadData();
    } catch (createError) {
      setError(asErrorMessage(createError));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async () => {
    if (!session) {
      return;
    }
    if (!selectedCategoryId.trim()) {
      setError("Category is required");
      return;
    }
    const price = Number.parseFloat(basePrice);
    const duration = Number.parseInt(estimatedDuration, 10);
    if (!serviceName.trim() || Number.isNaN(price) || Number.isNaN(duration)) {
      setError("Name, price and duration are required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const id = await createServiceDefinition(session.accessToken, {
        categoryId: selectedCategoryId,
        name: serviceName.trim(),
        description: serviceDescription.trim() || null,
        basePrice: price,
        estimatedDuration: duration
      });
      setSuccess(`Service created: ${id}`);
      await loadData();
    } catch (createError) {
      setError(asErrorMessage(createError));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateService = async () => {
    if (!session) {
      return;
    }
    if (!selectedServiceId.trim()) {
      setError("Select service first");
      return;
    }
    const price = Number.parseFloat(basePrice);
    const duration = Number.parseInt(estimatedDuration, 10);
    if (!serviceName.trim() || Number.isNaN(price) || Number.isNaN(duration)) {
      setError("Name, price and duration are required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await updateServiceDefinition(session.accessToken, selectedServiceId.trim(), {
        name: serviceName.trim(),
        description: serviceDescription.trim() || null,
        basePrice: price,
        estimatedDuration: duration,
        isActive
      });
      setSuccess("Service updated");
      await loadData();
    } catch (updateError) {
      setError(asErrorMessage(updateError));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async () => {
    if (!session) {
      return;
    }
    if (!selectedServiceId.trim()) {
      setError("Select service first");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteServiceDefinition(session.accessToken, selectedServiceId.trim());
      setSuccess("Service deleted");
      setSelectedServiceId("");
      await loadData();
    } catch (deleteError) {
      setError(asErrorMessage(deleteError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Service Admin" subtitle="Category + service management">
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}
      {loading ? <Text style={styles.meta}>Loading...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Create Category</Text>
        <LabeledInput
          label="Category Name"
          value={categoryName}
          onChangeText={setCategoryName}
        />
        <LabeledInput
          label="Description"
          value={categoryDescription}
          onChangeText={setCategoryDescription}
          style={styles.multiLine}
          multiline
        />
        <ActionButton
          label={loading ? "Creating..." : "Create Category"}
          onPress={() => void handleCreateCategory()}
          disabled={loading}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Service Form (Create / Update / Delete)</Text>
        <Text style={styles.meta}>Category</Text>
        <View style={styles.chipRow}>
          {categories.map((category) => {
            const active = category.id === selectedCategoryId;
            return (
              <Pressable
                key={category.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategoryId(category.id)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <LabeledInput
          label="Selected Service ID"
          value={selectedServiceId}
          onChangeText={setSelectedServiceId}
          autoCapitalize="none"
        />
        <LabeledInput label="Service Name" value={serviceName} onChangeText={setServiceName} />
        <LabeledInput
          label="Description"
          value={serviceDescription}
          onChangeText={setServiceDescription}
          style={styles.multiLine}
          multiline
        />
        <LabeledInput
          label="Base Price"
          value={basePrice}
          onChangeText={setBasePrice}
          keyboardType="numeric"
        />
        <LabeledInput
          label="Estimated Duration (minutes)"
          value={estimatedDuration}
          onChangeText={setEstimatedDuration}
          keyboardType="number-pad"
        />
        <ActionButton
          label={isActive ? "Service Status: Active" : "Service Status: Inactive"}
          onPress={() => setIsActive((prev) => !prev)}
          variant="secondary"
        />
        <View style={styles.actionGroup}>
          <ActionButton
            label={loading ? "Creating..." : "Create Service"}
            onPress={() => void handleCreateService()}
            disabled={loading}
          />
          <ActionButton
            label={loading ? "Updating..." : "Update Service"}
            onPress={() => void handleUpdateService()}
            disabled={loading}
            variant="secondary"
          />
          <ActionButton
            label={loading ? "Deleting..." : "Delete Service"}
            onPress={() => void handleDeleteService()}
            disabled={loading}
            variant="danger"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Services ({services.length})</Text>
        {services.map((service) => (
          <Pressable
            key={service.id}
            style={[styles.serviceRow, selectedServiceId === service.id && styles.serviceRowActive]}
            onPress={() => setSelectedServiceId(service.id)}
          >
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.meta}>Category: {service.categoryName}</Text>
            <Text style={styles.meta}>
              Price: {formatCurrency(service.basePrice)} | Duration: {service.estimatedDuration}m
            </Text>
            <Text style={styles.meta}>Active: {service.isActive ? "Yes" : "No"}</Text>
            <Text style={styles.meta}>ID: {service.id}</Text>
          </Pressable>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 8
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff"
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  chipTextActive: {
    color: colors.primary
  },
  multiLine: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 10
  },
  actionGroup: {
    gap: 8
  },
  serviceRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    gap: 2,
    backgroundColor: "#fff"
  },
  serviceRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  serviceName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  success: {
    color: colors.success,
    fontSize: 13
  }
});

