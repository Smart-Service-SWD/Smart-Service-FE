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
      setError("Rating must be between 1 and 5");
      return;
    }
    if (!requestId.trim()) {
      setError("Service request ID is required");
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
      setSuccess(`Feedback created: ${feedbackId}`);
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
    <ScreenLayout title="Feedback" subtitle="Create + monitor your service feedbacks">
      <View style={styles.card}>
        <Text style={styles.title}>Create Feedback</Text>
        <LabeledInput
          label="Service Request ID"
          value={requestId}
          onChangeText={setRequestId}
          placeholder="Paste completed request ID"
          autoCapitalize="none"
        />
        <LabeledInput
          label="Rating (1-5)"
          value={rating}
          onChangeText={setRating}
          keyboardType="number-pad"
        />
        <LabeledInput
          label="Comment"
          value={comment}
          onChangeText={setComment}
          multiline
          style={styles.commentInput}
          placeholder="Service quality, timing, professionalism..."
        />
        <ActionButton
          label={busy ? "Submitting..." : "Submit Feedback"}
          onPress={() => void handleCreate()}
          disabled={busy}
        />
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>My Feedbacks ({items.length})</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.rowTitle}>Request: {item.serviceRequestId}</Text>
            <Text style={styles.rowMeta}>Rating: {item.rating}/5</Text>
            <Text style={styles.rowMeta}>Comment: {item.comment || "-"}</Text>
            <Text style={styles.rowMeta}>Created: {formatDateTime(item.createdAt)}</Text>
          </View>
        ))}
        {!items.length ? <Text style={styles.rowMeta}>No feedback yet</Text> : null}
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

