import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  type AnalyzeResult
} from "../api/customerApi";
import type { CustomerTabParamList } from "../../../app/navigation/types";

interface CategoriesResponse {
  getServiceCategories: ServiceCategory[];
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
  const [complexityLevel, setComplexityLevel] = useState("");
  const [attachmentFileName, setAttachmentFileName] = useState("");
  const [attachmentFileUrl, setAttachmentFileUrl] = useState("");
  const [attachmentType, setAttachmentType] = useState<number>(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
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

  const parsedComplexityLevel = useMemo(() => {
    if (!complexityLevel.trim()) {
      return null;
    }
    const num = Number.parseInt(complexityLevel, 10);
    if (Number.isNaN(num)) {
      return null;
    }
    return Math.min(5, Math.max(1, num));
  }, [complexityLevel]);

  const analyze = async () => {
    if (!description.trim()) {
      setError("Vui lòng nhập mô tả để AI phân tích");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");

    try {
      const result = await analyzeServiceText(description);
      setAnalysis(result);
      setComplexityLevel(String(result.complexity));
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
      const createdId = await createServiceRequest(session.accessToken, {
        customerId: session.userId,
        categoryId: selectedCategoryId,
        description,
        addressText: addressText.trim() || null,
        complexityLevel: parsedComplexityLevel
      });

      setSuccess(`Đã tạo yêu cầu thành công. Mã yêu cầu: ${createdId}`);
      setCreatedRequestId(createdId);
      setDescription("");
      setAddressText("");
      setComplexityLevel("");
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
        <Text style={styles.value}>Bước 3: Nhấn “Gửi yêu cầu”.</Text>
        <Text style={styles.value}>Bước 4: Nếu cần, thêm file đính kèm.</Text>
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
          hint="Nên mô tả tình trạng hiện tại, thời điểm phát sinh và mức độ khẩn cấp"
        />

        <LabeledInput
          label="Địa chỉ (tùy chọn)"
          value={addressText}
          onChangeText={setAddressText}
          placeholder="Số nhà, quận/huyện, tỉnh/thành"
        />

        <LabeledInput
          label="Độ phức tạp (1-5, tùy chọn)"
          value={complexityLevel}
          onChangeText={setComplexityLevel}
          keyboardType="number-pad"
          placeholder="Để trống nếu muốn AI/nhân viên đánh giá"
        />
      </View>

      {!!analysis ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Kết quả AI phân tích</Text>
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
        <Text style={styles.sectionTitle}>Bước 4 · Thêm tệp đính kèm (tùy chọn)</Text>
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
