import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
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
  createServiceAttachment,
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

const attachmentTypeOptions = [
  { label: "Ảnh", value: 0 },
  { label: "Video", value: 1 },
  { label: "Tài liệu", value: 2 },
  { label: "Khác", value: 3 }
] as const;

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
  const [attachmentFileName, setAttachmentFileName] = useState("");
  const [attachmentFileUrl, setAttachmentFileUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState<number>(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createResult, setCreateResult] = useState<CreateServiceRequestResult | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);

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

  const submitAttachment = async () => {
    if (!session) {
      setError("Bạn chưa đăng nhập");
      return;
    }
    if (!createdRequestId.trim()) {
      setError("Hãy tạo yêu cầu trước.");
      return;
    }
    if (!attachmentFileName.trim() || !attachmentFileUrl.trim()) {
      setError("Cần nhập tên tệp và liên kết tệp.");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const attachmentId = await createServiceAttachment(session.accessToken, {
        serviceRequestId: createdRequestId.trim(),
        fileName: attachmentFileName.trim(),
        fileUrl: attachmentFileUrl.trim(),
        type: attachmentType
      });
      setSuccess(`Đã thêm tệp đính kèm. Mã tệp: ${attachmentId}`);
      setAttachmentFileName("");
      setAttachmentFileUrl("");
    } catch (attachmentError) {
      setError(asErrorMessage(attachmentError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout
      title="Tạo yêu cầu dịch vụ"
      subtitle="Điền thông tin theo từng bước để gửi yêu cầu nhanh và dễ theo dõi"
    >
      <View style={styles.heroCard}>
        <Text style={styles.sectionTitle}>Các bước tạo yêu cầu</Text>
        <Text style={styles.value}>Bước 1: Chọn danh mục phù hợp.</Text>
        <Text style={styles.value}>
          Bước 2: Chọn đúng dịch vụ cụ thể để hệ thống tiếp nhận đúng loại yêu cầu.
        </Text>
        <Text style={styles.value}>Bước 3: Mô tả vấn đề càng rõ càng tốt.</Text>
        <Text style={styles.value}>Bước 4: Có thể chọn hoặc chụp ảnh minh họa.</Text>
        <Text style={styles.value}>
          Bước 5: Nhấn “Gửi yêu cầu”, hệ thống sẽ phân tích thông tin và tạo đơn.
        </Text>
        <Text style={styles.value}>
          Bước 6: Nếu cần, thêm liên kết tệp sau khi tạo yêu cầu.
        </Text>
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

        <Text style={styles.label}>Bước 2 · Chọn dịch vụ</Text>
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
          <Text style={styles.sectionTitle}>Bước 4 · Ảnh minh họa (tùy chọn)</Text>
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Bước 6 · Thêm liên kết tệp có sẵn (tùy chọn)</Text>
        {createdRequestId ? (
          <>
            <View style={styles.selectedServiceBox}>
              <Text style={styles.selectedServiceTitle}>Yêu cầu hiện tại</Text>
              <Text style={styles.selectedServiceValue}>{createdRequestId}</Text>
            </View>
            <Text style={styles.value}>
              Bước này phù hợp khi bạn đã có sẵn liên kết chia sẻ tới tệp trên Drive, OneDrive
              hoặc một nguồn lưu trữ khác.
            </Text>
            <LabeledInput
              label="Tên tệp"
              value={attachmentFileName}
              onChangeText={setAttachmentFileName}
              placeholder="report.pdf"
            />
            <LabeledInput
              label="Liên kết tệp"
              value={attachmentFileUrl}
              onChangeText={setAttachmentFileUrl}
              placeholder="https://example.com/report.pdf"
              autoCapitalize="none"
              hint="Hiện tại bước này nhận liên kết có sẵn. Ảnh minh họa từ máy đã được hỗ trợ ở bước 4."
            />
            <View style={styles.categoryGrid}>
              {attachmentTypeOptions.map((option) => {
                const active = option.value === attachmentType;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                    onPress={() => setAttachmentType(option.value)}
                  >
                    <Text
                      style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <Text style={styles.value}>
            Hãy tạo yêu cầu trước. Sau đó nếu bạn đã có sẵn liên kết tệp, hệ thống sẽ gắn liên kết
            đó vào đúng yêu cầu vừa tạo.
          </Text>
        )}
      </View>

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
        <ActionButton
          label={
            busy
              ? "Đang thêm..."
              : !createdRequestId
                ? "Tạo yêu cầu trước"
                : "Thêm liên kết tệp"
          }
          onPress={() => void submitAttachment()}
          disabled={busy || !createdRequestId.trim()}
          variant="secondary"
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 6
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 10
  },
  successCard: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#86efac",
    borderRadius: 16,
    padding: 14,
    gap: 8
  },
  alertCard: {
    backgroundColor: "#fff7ed",
    borderColor: "#fb923c"
  },
  alertBox: {
    backgroundColor: "#ffedd5",
    borderWidth: 1,
    borderColor: "#fdba74",
    borderRadius: 12,
    padding: 10,
    gap: 4
  },
  alertTitle: {
    color: "#9a3412",
    fontWeight: "700",
    fontSize: 13
  },
  alertText: {
    color: "#9a3412",
    fontSize: 12,
    lineHeight: 18
  },
  label: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 10
  },
  imageCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: "#fff"
  },
  previewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    gap: 6,
    backgroundColor: colors.surface
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.primarySoft
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  serviceGrid: {
    gap: 8
  },
  categoryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff"
  },
  categoryChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  categoryChipText: {
    color: colors.textMuted,
    fontWeight: "600"
  },
  categoryChipTextActive: {
    color: colors.primary
  },
  serviceCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    gap: 4,
    backgroundColor: "#fff"
  },
  serviceCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  serviceTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  serviceMeta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  selectedServiceBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    gap: 4,
    backgroundColor: "#fff"
  },
  selectedServiceTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  selectedServiceValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  selectedServiceMeta: {
    color: colors.textMuted,
    fontSize: 12
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  value: {
    color: colors.textMuted,
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
  }
});
