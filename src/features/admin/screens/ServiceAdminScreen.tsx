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
import SectionCard from "../../../shared/ui/SectionCard";
import MetricTile from "../../../shared/ui/MetricTile";
import StatusBadge from "../../../shared/ui/StatusBadge";
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
    <ScreenLayout
      title="Quản lý dịch vụ"
      subtitle="Danh mục và định nghĩa dịch vụ được sắp lại theo nhịp mobile dễ thao tác hơn"
    >
      <SectionCard tone="primary" title="Tổng quan catalog">
        <View style={styles.metricGrid}>
          <MetricTile label="Danh mục" value={categories.length} helper="Nhóm dịch vụ hiện có" tone="primary" />
          <MetricTile label="Dịch vụ" value={services.length} helper="Trong danh mục đang chọn" tone="success" />
          <MetricTile label="Danh mục đang xem" value={selectedCategoryId ? 1 : 0} helper="Đã chọn để thao tác" tone="warning" />
        </View>
        {loading ? <Text style={styles.meta}>Đang đồng bộ dữ liệu dịch vụ...</Text> : null}
      </SectionCard>

      {!!error ? (
        <SectionCard tone="danger">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      {!!success ? (
        <SectionCard tone="success">
          <Text style={styles.success}>{success}</Text>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Tạo danh mục mới"
        subtitle="Dùng cho các nhóm dịch vụ lớn trước khi thêm từng service cụ thể"
      >
        <LabeledInput label="Tên danh mục" value={categoryName} onChangeText={setCategoryName} />
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
      </SectionCard>

      <SectionCard
        title="Quản lý dịch vụ"
        subtitle="Chọn danh mục, chạm vào một dịch vụ để nạp form chỉnh sửa hoặc tạo mới"
      >
        <Text style={styles.sectionLabel}>Danh mục</Text>
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

        {selectedService ? (
          <View style={styles.selectedServiceCard}>
            <Text style={styles.selectedServiceTitle}>Đang chỉnh: {selectedService.name}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge
                label={selectedService.isActive ? "Đang hoạt động" : "Không hoạt động"}
                tone={selectedService.isActive ? "success" : "danger"}
              />
              <StatusBadge
                label={selectedService.isDangerous ? "Nguy hiểm" : "Bình thường"}
                tone={selectedService.isDangerous ? "warning" : "neutral"}
              />
              <StatusBadge
                label={`AI baseline ${formatComplexityRange(selectedService.complexityRange)}`}
                tone="primary"
              />
            </View>
            <Text style={styles.meta}>
              Giá cơ sở: {formatCurrency(selectedService.basePrice)} • Thời gian chuẩn: {selectedService.estimatedDuration} phút
            </Text>
          </View>
        ) : (
          <Text style={styles.hint}>Chưa chọn service. Nhấn vào một service trong danh sách bên dưới để nạp form sửa.</Text>
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
          hint="Phạm vi này được backend dùng làm baseline khi AI phân tích yêu cầu."
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
            Backend hiện vẫn có khả năng chưa persist đầy đủ `complexityRange` và `isDangerous` khi cập nhật service cũ.
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
      </SectionCard>

      <SectionCard
        title={`Dịch vụ trong danh mục (${services.length})`}
        subtitle="Danh sách rút gọn, chạm để nạp lên form quản lý phía trên"
      >
        <View style={styles.serviceList}>
          {services.map((service) => (
            <Pressable
              key={service.id}
              style={[styles.serviceRow, selectedServiceId === service.id && styles.serviceRowActive]}
              onPress={() => setSelectedServiceId(service.id)}
            >
              <View style={styles.serviceRowHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <StatusBadge
                  label={service.isActive ? "Hoạt động" : "Tạm dừng"}
                  tone={service.isActive ? "success" : "danger"}
                />
              </View>
              <View style={styles.badgeRow}>
                <StatusBadge label={service.categoryName} tone="neutral" />
                <StatusBadge
                  label={service.isDangerous ? "Nguy hiểm" : "Bình thường"}
                  tone={service.isDangerous ? "warning" : "primary"}
                />
              </View>
              <Text style={styles.meta}>
                Giá: {formatCurrency(service.basePrice)} • Thời gian: {service.estimatedDuration} phút
              </Text>
              <Text style={styles.meta}>
                Baseline AI: {formatComplexityRange(service.complexityRange)}
              </Text>
            </Pressable>
          ))}
        </View>
        {!services.length ? <Text style={styles.hint}>Danh mục này chưa có dịch vụ nào.</Text> : null}
      </SectionCard>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surfaceRaised
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  chipTextActive: {
    color: colors.primaryStrong
  },
  selectedServiceCard: {
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 22,
    padding: 14,
    gap: 8,
    backgroundColor: colors.primarySoftAlt
  },
  selectedServiceTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15
  },
  multiLine: {
    minHeight: 92,
    textAlignVertical: "top",
    paddingTop: 12
  },
  actionGroup: {
    gap: 8
  },
  serviceList: {
    gap: 10
  },
  serviceRow: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 12,
    gap: 8,
    backgroundColor: colors.surfaceRaised
  },
  serviceRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoftAlt
  },
  serviceRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10
  },
  serviceName: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
    flex: 1,
    lineHeight: 20
  },
  sectionLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  },
  success: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18
  }
});
