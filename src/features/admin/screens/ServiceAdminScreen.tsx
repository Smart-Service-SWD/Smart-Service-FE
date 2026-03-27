import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { SERVICE_CATEGORIES_QUERY, SERVICE_DEFINITIONS_BY_CATEGORY_QUERY } from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatCurrency } from "../../../shared/utils/format";
import type { ServiceCategory, ServiceDefinition } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import { createCategory, createServiceDefinition, deleteServiceDefinition, updateServiceDefinition } from "../api/adminApi";

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

type ActivePanel = "category" | "service" | null;

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
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const loadCategories = async () => {
    if (!session) return;
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
    if (!selectedServiceId) return;
    const stillVisible = services.some((service) => service.id === selectedServiceId);
    if (!stillVisible) setSelectedServiceId("");
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

  const togglePanel = (panel: ActivePanel) => {
    setError("");
    setSuccess("");
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const isDuplicateService = (): boolean => {
    const trimmedName = serviceName.trim().toLowerCase();
    const trimmedDesc = (serviceDescription.trim() || "").toLowerCase();
    const price = Number.parseFloat(basePrice);
    const duration = Number.parseInt(estimatedDuration, 10);
    const minC = Number.parseInt(complexityMin, 10);
    const maxC = Number.parseInt(complexityMax, 10);

    return services.some((svc) => {
      const svcName = svc.name.toLowerCase();
      const svcDesc = (svc.description ?? "").toLowerCase();
      const [svcMin = DEFAULT_COMPLEXITY_RANGE[0], svcMax = DEFAULT_COMPLEXITY_RANGE[1]] =
        svc.complexityRange ?? DEFAULT_COMPLEXITY_RANGE;

      return (
        svcName === trimmedName &&
        svcDesc === trimmedDesc &&
        svc.basePrice === price &&
        svc.estimatedDuration === duration &&
        svcMin === minC &&
        svcMax === maxC &&
        !!svc.isDangerous === isDangerous
      );
    });
  };

  const handleCreateCategory = async () => {
    if (!session) return;
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
    if (!session) return;
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
    if (!complexityRange) return;
    if (price < 0 || duration <= 0) {
      setError("Giá cơ bản phải >= 0 và thời gian ước tính phải > 0");
      return;
    }

    if (isDuplicateService()) {
      setError("Dịch vụ này đã tồn tại trong danh mục hiện tại với cùng tên, mô tả, giá, thời gian và cấu hình.");
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
    if (!session) return;
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
    if (!complexityRange) return;
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

  const handleDeleteService = async (serviceId?: string) => {
    if (!session) return;
    const idToDelete = (serviceId ?? selectedServiceId).trim();
    if (!idToDelete) {
      setError("Vui lòng chọn dịch vụ từ danh sách");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteServiceDefinition(session.accessToken, idToDelete);
      setSuccess("Đã xóa dịch vụ thành công");

      if (idToDelete === selectedServiceId) setSelectedServiceId("");

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

  const handleCancelEdit = () => {
    setSelectedServiceId("");
    setError("");
    setSuccess("");
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Quản lý dịch vụ</Text>
              <Text style={styles.headerSub}>Danh mục và định nghĩa dịch vụ</Text>
            </View>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              <MaterialIcons name="warning-amber" size={14} color={colors.danger} /> {error}
            </Text>
          </View>
        )}
        {!!success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              <MaterialIcons name="check-circle" size={14} color="#1d4ed8" /> {success}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan catalog</Text>
          <View style={styles.countRow}>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{categories.length}</Text>
              <Text style={styles.countLabel}>Danh mục</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{services.length}</Text>
              <Text style={styles.countLabel}>Dịch vụ</Text>
            </View>
          </View>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>Đang đồng bộ...</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.toggleRow}>
          <Pressable style={[styles.toggleBtn, activePanel === "category" && styles.toggleBtnActive]} onPress={() => togglePanel("category")}>
            <MaterialIcons name="category" size={18} color={activePanel === "category" ? "#fff" : "#0f172a"} />
            <Text style={[styles.toggleBtnText, activePanel === "category" && styles.toggleBtnTextActive]}>Tạo danh mục</Text>
          </Pressable>

          <Pressable style={[styles.toggleBtn, activePanel === "service" && styles.toggleBtnActive]} onPress={() => togglePanel("service")}>
            <MaterialIcons name="build" size={18} color={activePanel === "service" ? "#fff" : "#0f172a"} />
            <Text style={[styles.toggleBtnText, activePanel === "service" && styles.toggleBtnTextActive]}>Tạo dịch vụ</Text>
          </Pressable>
        </View>

        {activePanel === "category" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tạo danh mục mới</Text>
            <LabeledInput label="Tên danh mục" value={categoryName} onChangeText={setCategoryName} />
            <LabeledInput label="Mô tả" value={categoryDescription} onChangeText={setCategoryDescription} style={styles.multiLine} multiline />
            <ActionButton label={loading ? "Đang tạo..." : "Tạo danh mục"} onPress={() => void handleCreateCategory()} disabled={loading} />

            {categories.length > 0 && (
              <View style={styles.existingSection}>
                <Text style={styles.sectionLabel}>Danh mục hiện có ({categories.length})</Text>
                <View style={styles.chipRow}>
                  {categories.map((cat) => (
                    <View key={cat.id} style={styles.chipReadOnly}>
                      <Text style={styles.chipReadOnlyText}>{cat.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {activePanel === "service" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Quản lý dịch vụ</Text>

              <Text style={styles.sectionLabel}>Danh mục</Text>
              <View style={styles.chipRow}>
                {categories.map((category) => {
                  const active = category.id === selectedCategoryId;
                  return (
                    <Pressable key={category.id} style={[styles.chip, active && styles.chipActive]} onPress={() => setSelectedCategoryId(category.id)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {selectedService ? (
                <View style={styles.selectedCard}>
                  <Text style={styles.selectedTitle}>Đang chọn: {selectedService.name}</Text>
                  <View style={styles.badgeRow}>
                    <View style={[styles.statusPill, { backgroundColor: selectedService.isActive ? "#f0fdf4" : "#fef2f2" }]}>
                      <Text style={[styles.statusText, { color: selectedService.isActive ? "#16a34a" : "#dc2626" }]}>
                        {selectedService.isActive ? "Đang hoạt động" : "Không hoạt động"}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: selectedService.isDangerous ? "#fefce8" : "#f0f4ff" }]}>
                      <Text style={[styles.statusText, { color: selectedService.isDangerous ? "#ca8a04" : "#64748b" }]}>
                        {selectedService.isDangerous ? "Nguy hiểm" : "Bình thường"}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                      <Text style={[styles.statusText, { color: "#2563eb" }]}>AI baseline {formatComplexityRange(selectedService.complexityRange)}</Text>
                    </View>
                  </View>
                  <Text style={styles.metaText}>
                    Giá cơ sở: {formatCurrency(selectedService.basePrice)} • Thời gian: {selectedService.estimatedDuration} phút
                  </Text>
                </View>
              ) : (
                <Text style={styles.hintText}>Chưa chọn service. Nhấn vào card service trong danh sách bên dưới để chỉnh.</Text>
              )}

              <LabeledInput label="Tên dịch vụ" value={serviceName} onChangeText={setServiceName} />
              <LabeledInput label="Mô tả" value={serviceDescription} onChangeText={setServiceDescription} style={styles.multiLine} multiline />
              <LabeledInput label="Giá cơ bản (VNĐ)" value={basePrice} onChangeText={setBasePrice} keyboardType="numeric" />
              <LabeledInput label="Thời gian ước tính (phút)" value={estimatedDuration} onChangeText={setEstimatedDuration} keyboardType="number-pad" />
              <LabeledInput
                label="Độ phức tạp tối thiểu (1-5)"
                value={complexityMin}
                onChangeText={setComplexityMin}
                keyboardType="number-pad"
                hint="Phạm vi này được backend dùng làm baseline khi AI phân tích yêu cầu."
              />
              <LabeledInput label="Độ phức tạp tối đa (1-5)" value={complexityMax} onChangeText={setComplexityMax} keyboardType="number-pad" />

              <View style={styles.inlineToggleRow}>
                <View style={styles.inlineToggleCol}>
                  <ActionButton
                    label={isDangerous ? "Loại: Nguy hiểm" : "Loại: Bình thường"}
                    onPress={() => setIsDangerous((prev) => !prev)}
                    variant={isDangerous ? "danger" : "secondary"}
                    size="sm"
                  />
                </View>
                <View style={styles.inlineToggleCol}>
                  <ActionButton
                    label={isActive ? "Trạng thái: Hoạt động" : "Trạng thái: Tạm dừng"}
                    onPress={() => setIsActive((prev) => !prev)}
                    variant="secondary"
                    size="sm"
                  />
                </View>
              </View>

              {!selectedServiceId ? (
                <View style={styles.actionGroup}>
                  <ActionButton label={loading ? "Đang tạo..." : "Tạo dịch vụ"} onPress={() => void handleCreateService()} disabled={loading} />
                </View>
              ) : (
                <View style={styles.editActionRow}>
                  <View style={styles.editActionCol}>
                    <ActionButton
                      label={loading ? "Đang cập nhật..." : "Cập nhật dịch vụ"}
                      onPress={() => void handleUpdateService()}
                      disabled={loading || !selectedServiceId}
                      variant="secondary"
                    />
                  </View>
                  <View style={styles.editActionCol}>
                    <ActionButton label="Bỏ chọn" onPress={handleCancelEdit} disabled={loading} variant="danger" />
                  </View>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Dịch vụ trong danh mục ({services.length})</Text>

              {services.map((service) => (
                <Pressable
                  key={service.id}
                  style={[styles.serviceRow, selectedServiceId === service.id && styles.serviceRowActive]}
                  onPress={() => setSelectedServiceId(service.id)}
                >
                  <View style={styles.serviceRowHeader}>
                    <Text style={styles.serviceName}>{service.name}</Text>

                    <View style={styles.serviceRowHeaderRight}>
                      <View style={[styles.statusPill, { backgroundColor: service.isActive ? "#f0fdf4" : "#fef2f2" }]}>
                        <Text style={[styles.statusText, { color: service.isActive ? "#16a34a" : "#dc2626" }]}>
                          {service.isActive ? "Hoạt động" : "Tạm dừng"}
                        </Text>
                      </View>

                      {/* ✅ chỉ còn icon thùng rác */}
                      <Pressable hitSlop={10} onPress={() => void handleDeleteService(service.id)} style={[styles.iconBtn, styles.iconBtnDanger]}>
                        <MaterialIcons name="delete" size={16} color="#dc2626" />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    <View style={[styles.statusPill, { backgroundColor: "#f0f4ff" }]}>
                      <Text style={[styles.statusText, { color: "#64748b" }]}>{service.categoryName}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: service.isDangerous ? "#fefce8" : "#eff6ff" }]}>
                      <Text style={[styles.statusText, { color: service.isDangerous ? "#ca8a04" : "#2563eb" }]}>
                        {service.isDangerous ? "Nguy hiểm" : "Bình thường"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.metaText}>
                    Giá: {formatCurrency(service.basePrice)} • Thời gian: {service.estimatedDuration} phút
                  </Text>
                  <Text style={styles.metaText}>Baseline AI: {formatComplexityRange(service.complexityRange)}</Text>
                </Pressable>
              ))}

              {!services.length ? <Text style={styles.emptyText}>Danh mục này chưa có dịch vụ nào.</Text> : null}
            </View>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4ff" },
  scroll: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 20, gap: 14 },

  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    gap: 14,
    alignItems: "flex-start",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
    marginHorizontal: 20
  },
  headerLeft: { flexDirection: "row", gap: 12, flex: 1, alignItems: "flex-start" },
  logoBox: { width: 50, height: 50, borderRadius: 14, overflow: "hidden", flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  errorBox: {
    marginHorizontal: 20,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12
  },
  errorText: { fontSize: 13, color: colors.danger },
  successBox: {
    marginHorizontal: 20,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 12,
    padding: 12
  },
  successText: { fontSize: 13, color: "#1d4ed8", fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: "#64748b" },

  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },

  countRow: { flexDirection: "row", gap: 10 },
  countBadge: {
    flex: 1,
    backgroundColor: "#f0f4ff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  countNumber: { fontSize: 20, fontWeight: "800", color: colors.text },
  countLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  toggleRow: { flexDirection: "row", gap: 10, marginHorizontal: 20 },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  toggleBtnText: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  toggleBtnTextActive: { color: "#fff" },

  sectionLabel: { color: "#0f172a", fontWeight: "700", fontSize: 13 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#f0f4ff"
  },
  chipActive: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  chipText: { color: "#64748b", fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: colors.primary },
  chipReadOnly: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#f8fafc"
  },
  chipReadOnlyText: { color: "#64748b", fontSize: 12, fontWeight: "600" },

  existingSection: { gap: 8, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12 },

  selectedCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: "#eff6ff"
  },
  selectedTitle: { color: "#0f172a", fontWeight: "800", fontSize: 14 },

  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  statusText: { fontSize: 9, fontWeight: "800" },
  metaText: { fontSize: 11, color: "#64748b" },
  hintText: { color: "#94a3b8", fontSize: 12, lineHeight: 18 },

  multiLine: { minHeight: 92, textAlignVertical: "top", paddingTop: 12 },

  inlineToggleRow: { flexDirection: "row", gap: 10 },
  inlineToggleCol: { flex: 1 },

  actionGroup: { gap: 8 },

  editActionRow: { flexDirection: "row", gap: 10 },
  editActionCol: { flex: 1 },

  serviceRow: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 8
  },
  serviceRowActive: { borderColor: colors.primary, backgroundColor: "#eff6ff" },

  serviceRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8
  },
  serviceRowHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },

  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center"
  },
  iconBtnDanger: {
    backgroundColor: "#fff1f2",
    borderColor: "#fecaca"
  },

  serviceName: { color: "#0f172a", fontWeight: "800", fontSize: 13, flex: 1, lineHeight: 19 },
  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center", paddingVertical: 8 }
});
