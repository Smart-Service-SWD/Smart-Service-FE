import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  SERVICE_CATEGORIES_QUERY,
  SERVICE_DEFINITIONS_BY_CATEGORY_QUERY
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

interface ServicesByCategoryResponse {
  getServiceDefinitionsByCategory: ServiceDefinition[];
}

const DEFAULT_COMPLEXITY_RANGE: [number, number] = [1, 3];

const formatComplexityRange = (range?: number[] | null): string => {
  if (!range || range.length < 2) {
    return `${DEFAULT_COMPLEXITY_RANGE[0]}-${DEFAULT_COMPLEXITY_RANGE[1]}`;
  }

  return `${range[0]}-${range[1]}`;
};

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
  const [complexityMin, setComplexityMin] = useState(String(DEFAULT_COMPLEXITY_RANGE[0]));
  const [complexityMax, setComplexityMax] = useState(String(DEFAULT_COMPLEXITY_RANGE[1]));
  const [isDangerous, setIsDangerous] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const loadCategories = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const categoryData = await graphqlRequest<CategoryResponse>(SERVICE_CATEGORIES_QUERY);
      setCategories(categoryData.getServiceCategories);
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
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    const loadServicesByCategory = async () => {
      if (!selectedCategoryId) {
        setServices([]);
        setSelectedServiceId("");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await graphqlRequest<ServicesByCategoryResponse, { categoryId: string }>(
          SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
          { categoryId: selectedCategoryId }
        );
        setServices(data.getServiceDefinitionsByCategory);
      } catch (loadError) {
        setServices([]);
        setSelectedServiceId("");
        setError(asErrorMessage(loadError));
      } finally {
        setLoading(false);
      }
    };

    void loadServicesByCategory();
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!selectedServiceId) {
      return;
    }

    const stillVisible = services.some((service) => service.id === selectedServiceId);
    if (!stillVisible) {
      setSelectedServiceId("");
    }
  }, [services, selectedServiceId]);

  useEffect(() => {
    if (!selectedService) {
      // Reset form khi bỏ chọn (sau xóa hoặc chọn lại)
      setServiceName("");
      setServiceDescription("");
      setBasePrice("100000");
      setEstimatedDuration("60");
      setComplexityMin(String(DEFAULT_COMPLEXITY_RANGE[0]));
      setComplexityMax(String(DEFAULT_COMPLEXITY_RANGE[1]));
      setIsDangerous(false);
      setIsActive(true);
      return;
    }

    const [minComplexity = DEFAULT_COMPLEXITY_RANGE[0], maxComplexity = DEFAULT_COMPLEXITY_RANGE[1]] =
      selectedService.complexityRange ?? DEFAULT_COMPLEXITY_RANGE;

    setServiceName(selectedService.name);
    setServiceDescription(selectedService.description ?? "");
    setBasePrice(String(selectedService.basePrice));
    setEstimatedDuration(String(selectedService.estimatedDuration));
    setComplexityMin(String(minComplexity));
    setComplexityMax(String(maxComplexity));
    setIsDangerous(!!selectedService.isDangerous);
    setIsActive(selectedService.isActive);
  }, [selectedService]);

  const buildComplexityRange = (): [number, number] | null => {
    const min = Number.parseInt(complexityMin, 10);
    const max = Number.parseInt(complexityMax, 10);

    if (Number.isNaN(min) || Number.isNaN(max)) {
      setError("Độ phức tạp tối thiểu và tối đa phải là số từ 1 đến 5");
      return null;
    }

    if (min < 1 || min > 5 || max < 1 || max > 5) {
      setError("Độ phức tạp phải nằm trong khoảng 1 đến 5");
      return null;
    }

    if (min > max) {
      setError("Độ phức tạp tối thiểu không được lớn hơn tối đa");
      return null;
    }

    return [min, max];
  };

  const handleCreateCategory = async () => {
    if (!session) {
      return;
    }
    if (!categoryName.trim()) {
      setError("Tên danh mục là bắt buộc");
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
      setSuccess(`Đã tạo danh mục thành công. ID: ${id}`);
      setCategoryName("");
      setCategoryDescription("");
      await loadCategories();
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
      setError("Vui lòng chọn danh mục");
      return;
    }
    const price = Number.parseFloat(basePrice);
    const duration = Number.parseInt(estimatedDuration, 10);
    const complexityRange = buildComplexityRange();
    if (!serviceName.trim() || Number.isNaN(price) || Number.isNaN(duration)) {
      setError("Tên dịch vụ, giá và thời gian là bắt buộc");
      return;
    }
    if (!complexityRange) {
      return;
    }
    if (price < 0 || duration <= 0) {
      setError("Giá cơ bản phải >= 0 và thời gian ước tính phải > 0");
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
        estimatedDuration: duration,
        complexityRange,
        isDangerous
      });
      setSuccess(`Đã tạo dịch vụ thành công. ID: ${id}`);
      const data = await graphqlRequest<ServicesByCategoryResponse, { categoryId: string }>(
        SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
        { categoryId: selectedCategoryId }
      );
      setServices(data.getServiceDefinitionsByCategory);
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
      setError("Vui lòng chọn dịch vụ từ danh sách");
      return;
    }
    const price = Number.parseFloat(basePrice);
    const duration = Number.parseInt(estimatedDuration, 10);
    const complexityRange = buildComplexityRange();
    if (!serviceName.trim() || Number.isNaN(price) || Number.isNaN(duration)) {
      setError("Tên dịch vụ, giá và thời gian là bắt buộc");
      return;
    }
    if (!complexityRange) {
      return;
    }
    if (price < 0 || duration <= 0) {
      setError("Giá cơ bản phải >= 0 và thời gian ước tính phải > 0");
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
        isActive,
        complexityRange,
        isDangerous
      });
      setSuccess("Đã cập nhật dịch vụ thành công");
      const data = await graphqlRequest<ServicesByCategoryResponse, { categoryId: string }>(
        SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
        { categoryId: selectedCategoryId }
      );
      setServices(data.getServiceDefinitionsByCategory);
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
      setError("Vui lòng chọn dịch vụ từ danh sách");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteServiceDefinition(session.accessToken, selectedServiceId.trim());
      setSuccess("Đã xóa dịch vụ thành công");
      setSelectedServiceId("");
      const data = await graphqlRequest<ServicesByCategoryResponse, { categoryId: string }>(
        SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
        { categoryId: selectedCategoryId }
      );
      setServices(data.getServiceDefinitionsByCategory);
    } catch (deleteError) {
      setError(asErrorMessage(deleteError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Quản lý dịch vụ" subtitle="Danh mục + định nghĩa dịch vụ">
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}
      {loading ? <Text style={styles.meta}>Đang xử lý...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Tạo danh mục mới</Text>
        <LabeledInput
          label="Tên danh mục"
          value={categoryName}
          onChangeText={setCategoryName}
        />
        <LabeledInput
          label="Mô tả"
          value={categoryDescription}
          onChangeText={setCategoryDescription}
          style={styles.multiLine}
          multiline
        />
        <ActionButton
          label={loading ? "Đang tạo..." : "Tạo danh mục"}
          onPress={() => void handleCreateCategory()}
          disabled={loading}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Quản lý dịch vụ (Tạo / Cập nhật / Xóa)</Text>
        <Text style={styles.meta}>Danh mục</Text>
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
        {selectedServiceId ? (
          <Text style={styles.hint}>
            Đã chọn: {selectedService?.name ?? selectedServiceId}
          </Text>
        ) : (
          <Text style={styles.hint}>Nhấn vào dịch vụ trong danh sách bên dưới để chỉnh sửa</Text>
        )}
        <LabeledInput label="Tên dịch vụ" value={serviceName} onChangeText={setServiceName} />
        <LabeledInput
          label="Mô tả"
          value={serviceDescription}
          onChangeText={setServiceDescription}
          style={styles.multiLine}
          multiline
        />
        <LabeledInput
          label="Giá cơ bản (VNĐ)"
          value={basePrice}
          onChangeText={setBasePrice}
          keyboardType="numeric"
        />
        <LabeledInput
          label="Thời gian ước tính (phút)"
          value={estimatedDuration}
          onChangeText={setEstimatedDuration}
          keyboardType="number-pad"
        />
        <LabeledInput
          label="Độ phức tạp tối thiểu (1-5)"
          value={complexityMin}
          onChangeText={setComplexityMin}
          keyboardType="number-pad"
          hint="BE dùng phạm vi này làm baseline cho AI khi phân tích yêu cầu."
        />
        <LabeledInput
          label="Độ phức tạp tối đa (1-5)"
          value={complexityMax}
          onChangeText={setComplexityMax}
          keyboardType="number-pad"
        />
        <ActionButton
          label={isDangerous ? "Loại dịch vụ: Nguy hiểm" : "Loại dịch vụ: Bình thường"}
          onPress={() => setIsDangerous((prev) => !prev)}
          variant={isDangerous ? "danger" : "secondary"}
        />
        <ActionButton
          label={isActive ? "Trạng thái: Đang hoạt động" : "Trạng thái: Không hoạt động"}
          onPress={() => setIsActive((prev) => !prev)}
          variant="secondary"
        />
        {selectedServiceId ? (
          <Text style={styles.warningText}>
            Lưu ý: BE hiện vẫn chưa persist `complexityRange` và `isDangerous` khi cập nhật
            service đã có. Tạo mới thì lưu được, còn chỉnh sửa service cũ thì 2 field này có thể
            chưa đổi trong DB.
          </Text>
        ) : null}
        <View style={styles.actionGroup}>
          <ActionButton
            label={loading ? "Đang tạo..." : "Tạo dịch vụ"}
            onPress={() => void handleCreateService()}
            disabled={loading}
          />
          <ActionButton
            label={loading ? "Đang cập nhật..." : "Cập nhật dịch vụ"}
            onPress={() => void handleUpdateService()}
            disabled={loading || !selectedServiceId}
            variant="secondary"
          />
          <ActionButton
            label={loading ? "Đang xóa..." : "Xóa dịch vụ"}
            onPress={() => void handleDeleteService()}
            disabled={loading || !selectedServiceId}
            variant="danger"
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Dịch vụ trong danh mục ({services.length})</Text>
        <Text style={styles.hint}>
          Danh sách này chỉ hiển thị dịch vụ của danh mục đang chọn.
        </Text>
        {services.map((service) => (
          <Pressable
            key={service.id}
            style={[styles.serviceRow, selectedServiceId === service.id && styles.serviceRowActive]}
            onPress={() => setSelectedServiceId(service.id)}
          >
            <View style={styles.serviceRowHeader}>
              <Text style={styles.serviceName}>{service.name}</Text>
              <View style={[styles.statusBadge, !service.isActive && styles.statusBadgeInactive]}>
                <Text style={styles.statusBadgeText}>
                  {service.isActive ? "Đang hoạt động" : "Không hoạt động"}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>Danh mục: {service.categoryName}</Text>
            <Text style={styles.meta}>
              Giá: {formatCurrency(service.basePrice)} | Thời gian: {service.estimatedDuration} phút
            </Text>
            <Text style={styles.meta}>
              Baseline AI: {formatComplexityRange(service.complexityRange)} |{" "}
              {service.isDangerous ? "Nguy hiểm" : "Bình thường"}
            </Text>
            <Text style={[styles.meta, styles.idText]}>ID: {service.id}</Text>
          </Pressable>
        ))}
        {!services.length ? (
          <Text style={styles.hint}>Danh mục này chưa có dịch vụ nào.</Text>
        ) : null}
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
  serviceRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  serviceName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    flex: 1
  },
  statusBadge: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  statusBadgeInactive: {
    backgroundColor: colors.textMuted
  },
  statusBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: "italic"
  },
  idText: {
    fontSize: 10,
    opacity: 0.7
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  warningText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18
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
