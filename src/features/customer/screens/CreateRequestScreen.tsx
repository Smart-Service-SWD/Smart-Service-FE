import { useEffect, useMemo, useState } from "react";
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

interface CategoriesResponse {
  getServiceCategories: ServiceCategory[];
}

const attachmentTypeOptions = [
  { label: "Image", value: 0 },
  { label: "Video", value: 1 },
  { label: "Document", value: 2 },
  { label: "Other", value: 3 }
] as const;

export default function CreateRequestScreen() {
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
      setError("Description is required for analysis");
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
      setError("Not authenticated");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }
    if (!selectedCategoryId) {
      setError("Please choose a category");
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

      setSuccess(`Created request ID: ${createdId}`);
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
      setError("Not authenticated");
      return;
    }
    if (!createdRequestId.trim()) {
      setError("Create request first or enter request ID");
      return;
    }
    if (!attachmentFileName.trim() || !attachmentFileUrl.trim()) {
      setError("Attachment name and URL are required");
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
      setSuccess(`Attachment created: ${attachmentId}`);
      setAttachmentFileName("");
      setAttachmentFileUrl("");
    } catch (attachmentError) {
      setError(asErrorMessage(attachmentError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout title="Create Request" subtitle="POST /api/service-requests">
      <View style={styles.card}>
        <Text style={styles.label}>Category</Text>
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
          label="Description"
          style={styles.multilineInput}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the service issue..."
          multiline
        />

        <LabeledInput
          label="Address (optional)"
          value={addressText}
          onChangeText={setAddressText}
          placeholder="Street / district / city"
        />

        <LabeledInput
          label="Complexity (1-5, optional)"
          value={complexityLevel}
          onChangeText={setComplexityLevel}
          keyboardType="number-pad"
          placeholder="Leave empty to let staff/AI evaluate"
        />
      </View>

      {!!analysis ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>AI Analysis Preview</Text>
          <Text style={styles.value}>Complexity: {analysis.complexity}</Text>
          <Text style={styles.value}>Summary: {analysis.userMessage.summary}</Text>
          <Text style={styles.value}>
            Risk: {analysis.userMessage.riskExplanation}
          </Text>
          <Text style={styles.value}>
            Safety: {analysis.userMessage.safetyAdvice}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Attach File (optional)</Text>
        <LabeledInput
          label="Request ID"
          value={createdRequestId}
          onChangeText={setCreatedRequestId}
          placeholder="Paste request ID"
          autoCapitalize="none"
        />
        <LabeledInput
          label="File Name"
          value={attachmentFileName}
          onChangeText={setAttachmentFileName}
          placeholder="report.pdf"
        />
        <LabeledInput
          label="File URL"
          value={attachmentFileUrl}
          onChangeText={setAttachmentFileUrl}
          placeholder="https://example.com/report.pdf"
          autoCapitalize="none"
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
          label={busy ? "Analyzing..." : "Analyze Description"}
          onPress={() => void analyze()}
          disabled={busy}
          variant="secondary"
        />
        <ActionButton
          label={busy ? "Submitting..." : "Submit Request"}
          onPress={() => void submit()}
          disabled={busy}
        />
        <ActionButton
          label={busy ? "Uploading..." : "Add Attachment"}
          onPress={() => void submitAttachment()}
          disabled={busy}
          variant="secondary"
        />
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
    fontSize: 13
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
