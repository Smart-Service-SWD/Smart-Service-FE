import { useEffect, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { asErrorMessage } from "../../../shared/utils/format";
import { useAuth } from "../../auth/AuthContext";
import type { ServiceCategory } from "../../../shared/types/domain";
import { SERVICE_CATEGORIES_QUERY } from "../../../shared/api/graphqlDocuments";
import ActionButton from "../../../shared/ui/ActionButton";
import LabeledInput from "../../../shared/ui/LabeledInput";
import {
  analyzeServiceText,
  createServiceAttachment,
  createServiceRequest,
  type AnalyzeResult,
  type CreateServiceRequestResult,
  type RequestImageAsset
} from "../api/customerApi";
import type { CustomerTabParamList } from "../../../app/navigation/types";

interface CategoriesResponse {
  getServiceCategories: ServiceCategory[];
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
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [addressText, setAddressText] = useState("");
  const [selectedImage, setSelectedImage] = useState<PickedRequestImage | null>(null);
  const [attachmentFileName, setAttachmentFileName] = useState("");
  const [attachmentFileUrl, setAttachmentFileUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState<number>(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [createResult, setCreateResult] = useState<CreateServiceRequestResult | null>(null);
  const [createdRequestId, setCreatedRequestId] = useState("");
  const [busy, setBusy] = useState(false);

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

  const setPickedImage = (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.type && asset.type !== "image") {
      setError("Chỉ hỗ trợ ảnh cho nhánh OCR của BE.");
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
    setSuccess("Đã chọn ảnh, ảnh này sẽ được gửi lên BE để OCR khi phân tích hoặc tạo request.");
    setError("");
  };

  const pickImageFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("FE cần quyền truy cập thư viện ảnh để gửi ảnh OCR.");
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
      setError("FE cần quyền camera để chụp ảnh gửi sang BE.");
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

  const analyze = async () => {
    if (!description.trim()) {
      setError("Vui lòng nhập mô tả để AI phân tích");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await analyzeServiceText(description, selectedImage);
      setAnalysis(result);
      setCreateResult(null);
    } catch (analysisError) {
      setError(asErrorMessage(analysisError));
    } finally {
      setBusy(false);
    }
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

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await createServiceRequest(session.accessToken, {
        customerId: session.userId,
        categoryId: selectedCategoryId,
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
      setAnalysis(null);
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
      setError("Hãy tạo yêu cầu trước hoặc nhập mã yêu cầu");
      return;
    }
    if (!attachmentFileName.trim() || !attachmentFileUrl.trim()) {
      setError("Cần nhập tên file và đường dẫn file");
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
        <Text style={styles.sectionTitle}>Các bước trên FE</Text>
        <Text style={styles.value}>Bước 1: Chọn danh mục phù hợp.</Text>
        <Text style={styles.value}>Bước 2: Mô tả vấn đề càng rõ càng tốt.</Text>
        <Text style={styles.value}>Bước 3: Có thể chọn hoặc chụp ảnh để BE OCR.</Text>
        <Text style={styles.value}>Bước 4: Có thể nhấn “Phân tích bằng AI” để xem trước.</Text>
        <Text style={styles.value}>Bước 5: Nhấn “Gửi yêu cầu”, BE sẽ OCR + AI rồi lưu kết quả trong một lần.</Text>
        <Text style={styles.value}>Bước 6: Nếu cần, thêm file đính kèm metadata riêng.</Text>
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

        <LabeledInput
          label="Bước 2 · Mô tả yêu cầu"
          style={styles.multilineInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Ví dụ: Máy lạnh không mát, có tiếng ồn lớn..."
          multiline
          hint="BE sẽ tự phân tích AI từ mô tả này, nên không cần nhập độ phức tạp thủ công nữa"
        />

        <LabeledInput
          label="Địa chỉ (tùy chọn)"
          value={addressText}
          onChangeText={setAddressText}
          placeholder="Số nhà, quận/huyện, tỉnh/thành"
        />

        <View style={styles.imageCard}>
          <Text style={styles.sectionTitle}>Ảnh cho OCR (tùy chọn)</Text>
          <Text style={styles.value}>
            Nếu có ảnh lỗi, ảnh thiết bị hoặc tài liệu, BE sẽ OCR ảnh này khi phân tích và tạo request.
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

      {!!analysis ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {selectedImage ? "Kết quả AI + OCR xem trước" : "Kết quả AI xem trước"}
          </Text>
          <Text style={styles.value}>Độ phức tạp gợi ý: {analysis.complexity}</Text>
          <Text style={styles.value}>Tóm tắt: {analysis.userMessage.summary}</Text>
          <Text style={styles.value}>Rủi ro: {analysis.userMessage.riskExplanation}</Text>
          <Text style={styles.value}>Khuyến nghị an toàn: {analysis.userMessage.safetyAdvice}</Text>
        </View>
      ) : null}

      {createdRequestId ? (
        <View style={styles.successCard}>
          <Text style={styles.sectionTitle}>Yêu cầu đã tạo</Text>
          <Text style={styles.value}>Mã yêu cầu: {createdRequestId}</Text>
          {createResult?.wasAnalyzedByAI ? (
            <>
              <Text style={styles.value}>
                Độ phức tạp từ BE: {createResult.aiComplexityLevel ?? "Chưa có"}
              </Text>
              {createResult.aiSummary ? (
                <Text style={styles.value}>Tóm tắt AI: {createResult.aiSummary}</Text>
              ) : null}
              {createResult.aiRiskExplanation ? (
                <Text style={styles.value}>Rủi ro AI: {createResult.aiRiskExplanation}</Text>
              ) : null}
              {createResult.ocrExtractedText ? (
                <Text style={styles.value}>OCR: {createResult.ocrExtractedText}</Text>
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
        <Text style={styles.sectionTitle}>Bước 6 · Thêm tệp đính kèm metadata (tùy chọn)</Text>
        <LabeledInput
          label="Mã yêu cầu"
          value={createdRequestId}
          onChangeText={setCreatedRequestId}
          placeholder="Dán mã yêu cầu"
          autoCapitalize="none"
        />
        <LabeledInput
          label="Tên tệp"
          value={attachmentFileName}
          onChangeText={setAttachmentFileName}
          placeholder="report.pdf"
        />
        <LabeledInput
          label="Đường dẫn tệp"
          value={attachmentFileUrl}
          onChangeText={setAttachmentFileUrl}
          placeholder="https://example.com/report.pdf"
          autoCapitalize="none"
          hint="Hiện tại FE đang nhận URL có sẵn, chưa hỗ trợ chọn file trực tiếp từ máy"
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
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.actions}>
        <ActionButton
          label={busy ? "Đang phân tích..." : "Phân tích bằng AI"}
          onPress={() => void analyze()}
          disabled={busy}
          variant="secondary"
        />
        <ActionButton
          label={busy ? "Đang gửi..." : "Gửi yêu cầu"}
          onPress={() => void submit()}
          disabled={busy}
        />
        <ActionButton
          label={busy ? "Đang thêm..." : "Thêm tệp đính kèm"}
          onPress={() => void submitAttachment()}
          disabled={busy}
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
  success: {
    color: colors.success,
    fontSize: 13
  },
  disabledButton: {
    opacity: 0.7
  }
});
