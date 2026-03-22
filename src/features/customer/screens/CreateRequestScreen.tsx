import { useEffect, useMemo, useState, useCallback } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { asErrorMessage } from "../../../shared/utils/format";
import { useAuth } from "../../auth/AuthContext";
import type { ServiceCategory, ServiceDefinition } from "../../../shared/types/domain";
import {
  SERVICE_CATEGORIES_QUERY,
  SERVICE_DEFINITIONS_BY_CATEGORY_QUERY
} from "../../../shared/api/graphqlDocuments";
import ActionButton from "../../../shared/ui/ActionButton";
import LabeledInput from "../../../shared/ui/LabeledInput";
import {
  createServiceRequest,
  type CreateServiceRequestResult,
  type RequestImageAsset
} from "../api/customerApi";
import type { CustomerTabParamList } from "../../../app/navigation/types";

interface CategoriesResponse {
  getServiceCategories: ServiceCategory[];
}

interface ServicesByCategoryResponse {
  getServiceDefinitionsByCategory: ServiceDefinition[];
}

interface PickedRequestImage extends RequestImageAsset {
  width: number;
  height: number;
  fileSize?: number;
}

export default function CreateRequestScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();
  const { session } = useAuth();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedServiceDefinitionId, setSelectedServiceDefinitionId] = useState("");
  const [description, setDescription] = useState("");
  const [addressText, setAddressText] = useState("");
  const [selectedImage, setSelectedImage] = useState<PickedRequestImage | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createResult, setCreateResult] = useState<CreateServiceRequestResult | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [isServiceExpanded, setIsServiceExpanded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceDefinitionId) ?? null,
    [services, selectedServiceDefinitionId]
  );

  const canSubmitRequest =
    !!session &&
    !busy &&
    !servicesLoading &&
    !!selectedCategoryId &&
    !!selectedServiceDefinitionId &&
    !!description.trim() &&
    !!addressText.trim();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await graphqlRequest<CategoriesResponse>(SERVICE_CATEGORIES_QUERY);
        setCategories(data.getServiceCategories);
        if (data.getServiceCategories.length > 0) {
          setSelectedCategoryId(data.getServiceCategories[0].id);
        }
      } catch (loadError) {
        setError(asErrorMessage(loadError));
      }
    };

    void loadCategories();
  }, []);

  // Clear previous create result / AI analysis when screen becomes focused
  useFocusEffect(
    useCallback(() => {
      setCreateResult(null);
      setCreatedRequestId("");
      setSuccess("");
      setError("");
    }, [])
  );

  useEffect(() => {
    if (!selectedCategoryId) {
      setServices([]);
      setSelectedServiceDefinitionId("");
      return;
    }

    let cancelled = false;

    const loadServices = async () => {
      setServicesLoading(true);
      try {
        const data = await graphqlRequest<ServicesByCategoryResponse, { categoryId: string }>(
          SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
          { categoryId: selectedCategoryId }
        );

        if (cancelled) {
          return;
        }

        const activeServices = data.getServiceDefinitionsByCategory.filter(
          (service) => service.isActive
        );

        setServices(activeServices);
        setSelectedServiceDefinitionId((current) =>
          activeServices.some((service) => service.id === current)
            ? current
            : activeServices[0]?.id ?? ""
        );
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setServices([]);
        setSelectedServiceDefinitionId("");
        setError(asErrorMessage(loadError));
      } finally {
        if (!cancelled) {
          setServicesLoading(false);
        }
      }
    };

    void loadServices();

    return () => {
      cancelled = true;
    };
  }, [selectedCategoryId]);

  const setPickedImage = (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.type && asset.type !== "image") {
      setError("Hiện tại bước này chỉ hỗ trợ ảnh.");
      return;
    }

    setSelectedImage({
      uri: asset.uri,
      fileName: asset.fileName ?? "request-image.jpg",
      mimeType: asset.mimeType ?? "image/jpeg",
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize
    });
    setSuccess("Đã chọn ảnh để gửi cùng yêu cầu.");
    setError("");
  };

  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Cần quyền truy cập thư viện ảnh để chọn ảnh đính kèm.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setPickedImage(result.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError("Cần quyền camera để chụp ảnh đính kèm.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
      cameraType: ImagePicker.CameraType.back
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    setPickedImage(result.assets[0]);
  };

  const submit = async () => {
    if (!session) {
      setError("Bạn chưa đăng nhập");
      return;
    }
    if (!description.trim()) {
      setError("Vui lòng nhập mô tả yêu cầu");
      return;
    }
    if (!selectedCategoryId) {
      setError("Vui lòng chọn danh mục");
      return;
    }
    if (!selectedServiceDefinitionId) {
      setError("Vui lòng chọn dịch vụ cụ thể");
      return;
    }
    if (!addressText.trim()) {
      setError("Vui lòng nhập địa chỉ để kỹ thuật viên có thể đến đúng nơi.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await createServiceRequest(session.accessToken, {
        customerId: session.userId,
        categoryId: selectedCategoryId,
        serviceDefinitionId: selectedServiceDefinitionId,
        description,
        addressText: addressText.trim() || null,
        image: selectedImage
      });

      setSuccess(`Đã tạo yêu cầu thành công. Mã yêu cầu: ${result.serviceRequestId}`);
      setCreatedRequestId(result.serviceRequestId);
      setCreateResult(result);
      setDescription("");
      setAddressText("");
      setSelectedImage(null);
    } catch (submitError) {
      setError(asErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Tạo yêu cầu</Text>
              <Text style={styles.headerSub}>Điền thông tin từng bước</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
        <Text style={styles.label}>Bước 1 · Chọn danh mục</Text>
        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const active = category.id === selectedCategoryId;
            return (
              <Pressable
                key={category.id}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => setSelectedCategoryId(category.id)}
              >
                <Text
                  style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.collapsibleHeader}
          onPress={() => setIsServiceExpanded((v) => !v)}
        >
          <Text style={styles.label}>Bước 2 · Chọn dịch vụ</Text>
          <MaterialIcons name={isServiceExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={18} color="#94a3b8" />
        </Pressable>
        {!isServiceExpanded && selectedService ? (
          <View style={styles.collapsedPreview}>
            <Text style={styles.collapsedPreviewText}>Đã chọn: {selectedService.name}</Text>
          </View>
        ) : null}
        {isServiceExpanded && (
          <>
        {servicesLoading ? (
          <Text style={styles.value}>Đang tải dịch vụ theo danh mục đã chọn...</Text>
        ) : services.length > 0 ? (
          <View style={styles.serviceGrid}>
            {services.map((service) => {
              const active = service.id === selectedServiceDefinitionId;

              return (
                <Pressable
                  key={service.id}
                  style={[styles.serviceCard, active && styles.serviceCardActive]}
                  onPress={() => setSelectedServiceDefinitionId(service.id)}
                >
                  <Text style={styles.serviceTitle}>{service.name}</Text>
                  <Text style={styles.serviceMeta}>
                    {service.estimatedDuration} phút • {service.basePrice.toLocaleString("vi-VN")} VNĐ
                  </Text>
                  <Text style={styles.serviceMeta}>
                    {service.isDangerous ? "Rủi ro cao" : "Thông thường"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={styles.value}>
            Danh mục này chưa có dịch vụ khả dụng. Vui lòng chọn danh mục khác.
          </Text>
        )}
        {selectedService ? (
          <View style={styles.selectedServiceBox}>
            <Text style={styles.selectedServiceTitle}>Dịch vụ đã chọn</Text>
            <Text style={styles.selectedServiceValue}>{selectedService.name}</Text>
            <Text style={styles.selectedServiceMeta}>
              {selectedService.estimatedDuration} phút •{" "}
              {selectedService.basePrice.toLocaleString("vi-VN")} VNĐ
            </Text>
          </View>
        ) : !servicesLoading ? (
          <Text style={styles.warningText}>
            Hãy chọn một dịch vụ trước khi gửi yêu cầu.
          </Text>
        ) : null}
          </>
        )}

        <LabeledInput
          label="Bước 3 · Mô tả yêu cầu"
          style={styles.multilineInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Ví dụ: Máy lạnh không mát, có tiếng ồn lớn..."
          multiline
          hint="Mô tả càng rõ thì hệ thống càng dễ phân tích và xử lý đúng yêu cầu."
        />

        <LabeledInput
          label="Địa chỉ"
          value={addressText}
          onChangeText={setAddressText}
          placeholder="Số nhà, quận/huyện, tỉnh/thành"
          hint="Địa chỉ này sẽ hiển thị cho staff và kỹ thuật viên khi xử lý yêu cầu."
        />

        <View style={styles.imageCard}>
        <Pressable
          style={styles.collapsibleHeader}
          onPress={() => setIsImageExpanded((v) => !v)}
        >
          <Text style={styles.sectionTitle}>Bước 4 · Ảnh minh họa (tùy chọn)</Text>
          <MaterialIcons name={isImageExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={18} color="#94a3b8" />
        </Pressable>
        {!isImageExpanded && selectedImage ? (
          <View style={styles.collapsedPreview}>
            <Image source={{ uri: selectedImage.uri }} style={styles.collapsedThumbnail} />
            <Text style={styles.collapsedPreviewText}>{selectedImage.fileName || "request-image.jpg"}</Text>
          </View>
        ) : null}
        {isImageExpanded && (
          <>
          <Text style={styles.value}>
            Nếu có ảnh lỗi, ảnh thiết bị hoặc tài liệu liên quan, bạn có thể gửi kèm để hỗ trợ xử lý.
          </Text>
          <View style={styles.actions}>
            <ActionButton
              label="Chọn ảnh từ máy"
              onPress={() => void pickImageFromLibrary()}
              disabled={busy}
              variant="secondary"
            />
            <ActionButton
              label="Chụp ảnh mới"
              onPress={() => void takePhoto()}
              disabled={busy}
              variant="secondary"
            />
            {selectedImage ? (
              <ActionButton
                label="Bỏ ảnh đã chọn"
                onPress={() => setSelectedImage(null)}
                disabled={busy}
                variant="danger"
              />
            ) : null}
          </View>

          {selectedImage ? (
            <View style={styles.previewCard}>
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
              <Text style={styles.value}>Tên file: {selectedImage.fileName || "request-image.jpg"}</Text>
              <Text style={styles.value}>
                Kích thước: {selectedImage.width} x {selectedImage.height}
              </Text>
              <Text style={styles.value}>Mime type: {selectedImage.mimeType || "image/jpeg"}</Text>
              <Text style={styles.value}>
                Dung lượng:{" "}
                {selectedImage.fileSize
                  ? `${Math.round(selectedImage.fileSize / 1024)} KB`
                  : "Không rõ"}
              </Text>
            </View>
          ) : null}
          </>
        )}
        </View>
      </View>

      {createdRequestId ? (
        <View
          style={[
            styles.successCard,
            createResult?.isDangerFlagged ? styles.alertCard : null
          ]}
        >
          <Text style={styles.sectionTitle}>Yêu cầu đã tạo</Text>
          <Text style={styles.value}>Mã yêu cầu: {createdRequestId}</Text>
          <Text style={styles.value}>
            Dưới đây là kết quả phân tích hệ thống trả về ngay sau khi tạo yêu cầu.
          </Text>
          <Text style={styles.value}>
            Sau khi tạo xong, nhân viên sẽ tiếp tục xử lý yêu cầu của bạn.
          </Text>
          {createResult?.wasAnalyzedByAI ? (
            <>
              {createResult.isDangerFlagged || (createResult.aiUrgencyLevel ?? 0) >= 4 ? (
                <View style={styles.alertBox}>
                  <Text style={styles.alertTitle}>
                    {createResult.isDangerFlagged
                      ? "Yêu cầu cần lưu ý an toàn"
                      : "Yêu cầu có mức ưu tiên cao"}
                  </Text>
                  <Text style={styles.alertText}>
                    {createResult.isDangerFlagged
                      ? "Vui lòng xem kỹ phần chẩn đoán và khuyến nghị an toàn trước khi tiếp tục."
                      : "Yêu cầu này có thể được ưu tiên xử lý sớm hơn các đơn thông thường."}
                  </Text>
                </View>
              ) : null}
              <Text style={styles.value}>
                Độ phức tạp gợi ý: {createResult.aiComplexityLevel ?? "Chưa có"}
              </Text>
              <Text style={styles.value}>
                Mức ưu tiên: {createResult.aiUrgencyLevel ?? "Chưa có"}
              </Text>
              <Text style={styles.value}>
                Cờ nguy hiểm: {createResult.isDangerFlagged ? "Có" : "Không"}
              </Text>
              {createResult.aiSummary ? (
                <Text style={styles.value}>Tóm tắt AI: {createResult.aiSummary}</Text>
              ) : null}
              {createResult.aiProblemDiagnosis ? (
                <Text style={styles.value}>
                  Chẩn đoán AI: {createResult.aiProblemDiagnosis}
                </Text>
              ) : null}
              {createResult.aiRiskExplanation ? (
                <Text style={styles.value}>Rủi ro AI: {createResult.aiRiskExplanation}</Text>
              ) : null}
              {createResult.aiSafetyAdvice ? (
                <Text style={styles.value}>
                  Khuyến nghị an toàn: {createResult.aiSafetyAdvice}
                </Text>
              ) : null}
              {createResult.estimatedPrice ? (
                <Text style={styles.value}>
                  Chi phí ước tính: {createResult.estimatedPrice}
                </Text>
              ) : null}
              {createResult.estimatedDuration ? (
                <Text style={styles.value}>
                  Thời gian ước tính: {createResult.estimatedDuration}
                </Text>
              ) : null}
              {createResult.ocrExtractedText ? (
                <Text style={styles.value}>
                  Nội dung trích từ ảnh: {createResult.ocrExtractedText}
                </Text>
              ) : null}
            </>
          ) : null}
          <View style={styles.actions}>
            <ActionButton
              label="Xem yêu cầu của tôi"
              onPress={() => navigation.navigate("MyRequests")}
            />
            <ActionButton
              label="Thêm đánh giá sau khi hoàn thành"
              onPress={() => navigation.navigate("Feedback")}
              variant="secondary"
            />
          </View>
        </View>
      ) : null}

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.actions}>
        <ActionButton
          label={
            busy
              ? "Đang gửi..."
              : servicesLoading
                ? "Đang tải dịch vụ..."
                : !selectedServiceDefinitionId
                  ? "Chọn dịch vụ trước"
                  : !addressText.trim()
                    ? "Nhập địa chỉ trước"
                    : "Gửi yêu cầu"
          }
          onPress={() => void submit()}
          disabled={!canSubmitRequest}
        />
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f4ff"
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    gap: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 3,
    marginBottom: 8
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1
  },
  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.surfaceRaised
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a"
  },
  headerSub: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2
  },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  successCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 20,
    padding: 18,
    gap: 10
  },
  alertCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fb923c"
  },
  alertBox: {
    backgroundColor: "#ffedd5",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 14,
    padding: 14,
    gap: 6
  },
  alertTitle: {
    color: "#9a3412",
    fontWeight: "800",
    fontSize: 14
  },
  alertText: {
    color: "#9a3412",
    fontSize: 13,
    lineHeight: 19
  },
  label: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 10
  },
  imageCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    backgroundColor: "#f0f4ff"
  },
  previewCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: "#fff"
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#eff6ff"
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  serviceGrid: {
    gap: 10
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f0f4ff"
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: "#eff6ff"
  },
  categoryChipText: {
    color: "#64748b",
    fontWeight: "700",
    fontSize: 13
  },
  categoryChipTextActive: {
    color: colors.primary
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    gap: 6,
    backgroundColor: "#f0f4ff"
  },
  serviceCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#eff6ff"
  },
  serviceTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14
  },
  serviceMeta: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18
  },
  selectedServiceBox: {
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 14,
    padding: 14,
    gap: 4,
    backgroundColor: "#eff6ff"
  },
  selectedServiceTitle: {
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  selectedServiceValue: {
    color: "#0f172a",
    fontSize: 14,
    fontWeight: "800"
  },
  selectedServiceMeta: {
    color: "#64748b",
    fontSize: 12
  },
  sectionTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 15
  },
  value: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 20
  },
  actions: {
    gap: 10
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  warningText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18
  },
  success: {
    color: colors.success,
    fontSize: 13
  },
  disabledButton: {
    opacity: 0.7
  },

  // Collapsible sections
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4
  },
  chevronText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "700"
  },
  collapsedPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f0f4ff",
    borderRadius: 10,
    padding: 10
  },
  collapsedPreviewText: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: "600",
    flex: 1
  },
  collapsedThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#e2e8f0"
  }
});
