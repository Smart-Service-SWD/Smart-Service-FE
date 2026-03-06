import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { MY_FEEDBACKS_QUERY } from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatDateTime } from "../../../shared/utils/format";
import type { ServiceFeedbackItem } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import { createServiceFeedback } from "../api/customerApi";

interface MyFeedbackResponse {
  getMyServiceFeedbacks: ServiceFeedbackItem[];
}

export default function FeedbackScreen() {
  const { session } = useAuth();
  const [requestId, setRequestId] = useState("");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<ServiceFeedbackItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!session) {
      return;
    }
    try {
      const data = await graphqlRequest<MyFeedbackResponse>(
        MY_FEEDBACKS_QUERY,
        undefined,
        session.accessToken
      );
      setItems(data.getMyServiceFeedbacks);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const handleCreate = async () => {
    if (!session) {
      return;
    }

    const ratingNumber = Number.parseInt(rating, 10);
    if (Number.isNaN(ratingNumber) || ratingNumber < 1 || ratingNumber > 5) {
      setError("Điểm đánh giá phải từ 1 đến 5");
      return;
    }
    if (!requestId.trim()) {
      setError("Vui lòng nhập mã yêu cầu dịch vụ");
      return;
    }

    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const feedbackId = await createServiceFeedback(session.accessToken, {
        serviceRequestId: requestId.trim(),
        createdByUserId: session.userId,
        rating: ratingNumber,
        comment: comment.trim() || null
      });
      setSuccess(`Đã gửi đánh giá thành công. Mã đánh giá: ${feedbackId}`);
      setRequestId("");
      setComment("");
      await load();
    } catch (createError) {
      setError(asErrorMessage(createError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenLayout
      title="Đánh giá dịch vụ"
      subtitle="Gửi phản hồi sau khi yêu cầu hoàn thành và xem lại các đánh giá đã gửi"
    >
      <View style={styles.noteCard}>
        <Text style={styles.title}>Lưu ý</Text>
        <Text style={styles.rowMeta}>- Chỉ nên đánh giá sau khi yêu cầu đã hoàn thành.</Text>
        <Text style={styles.rowMeta}>- Điểm 5 là rất hài lòng, điểm 1 là chưa hài lòng.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Tạo đánh giá mới</Text>
        <LabeledInput
          label="Mã yêu cầu dịch vụ"
          value={requestId}
          onChangeText={setRequestId}
          placeholder="Dán mã yêu cầu đã hoàn thành"
          autoCapitalize="none"
        />
        <LabeledInput
          label="Điểm đánh giá (1-5)"
          value={rating}
          onChangeText={setRating}
          keyboardType="number-pad"
        />
        <LabeledInput
          label="Nhận xét"
          value={comment}
          onChangeText={setComment}
          multiline
          style={styles.commentInput}
          placeholder="Ví dụ: đến đúng giờ, xử lý nhanh, thái độ tốt..."
        />
        <ActionButton
          label={busy ? "Đang gửi..." : "Gửi đánh giá"}
          onPress={() => void handleCreate()}
          disabled={busy}
        />
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Đánh giá của tôi ({items.length})</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.rowTitle}>Yêu cầu: {item.serviceRequestId}</Text>
            <Text style={styles.rowMeta}>Điểm: {item.rating}/5</Text>
            <Text style={styles.rowMeta}>Nhận xét: {item.comment || "-"}</Text>
            <Text style={styles.rowMeta}>Tạo lúc: {formatDateTime(item.createdAt)}</Text>
          </View>
        ))}
        {!items.length ? <Text style={styles.rowMeta}>Bạn chưa gửi đánh giá nào</Text> : null}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  noteCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 4
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 8
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  commentInput: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 10
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  success: {
    color: colors.success,
    fontSize: 13
  },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    gap: 2,
    backgroundColor: "#fff"
  },
  rowTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12
  }
});
