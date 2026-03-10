import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  MY_FEEDBACKS_QUERY,
  MY_REQUESTS_QUERY,
  SERVICE_AGENTS_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatDateTime, formatShortId } from "../../../shared/utils/format";
import type {
  ServiceAgentItem,
  ServiceFeedbackItem,
  ServiceRequestItem
} from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import { createServiceFeedback } from "../api/customerApi";
import type { CustomerTabParamList } from "../../../app/navigation/types";

interface MyFeedbackResponse {
  getMyServiceFeedbacks: ServiceFeedbackItem[];
}

interface CompletedRequestsResponse {
  getMyServiceRequests: ServiceRequestItem[];
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

export default function FeedbackScreen() {
  const { session } = useAuth();
  const route = useRoute<RouteProp<CustomerTabParamList, "Feedback">>();
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();
  const [requestId, setRequestId] = useState(route.params?.requestId ?? "");
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [items, setItems] = useState<ServiceFeedbackItem[]>([]);
  const [completedRequests, setCompletedRequests] = useState<ServiceRequestItem[]>([]);
  const [agentNamesById, setAgentNamesById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const reviewedRequestIds = useMemo(
    () => new Set(items.map((item) => item.serviceRequestId)),
    [items]
  );

  const availableRequests = useMemo(
    () => completedRequests.filter((item) => !reviewedRequestIds.has(item.id)),
    [completedRequests, reviewedRequestIds]
  );

  const requestLabelsById = useMemo(
    () =>
      Object.fromEntries(
        completedRequests.map((item) => [item.id, item.description])
      ),
    [completedRequests]
  );

  const getAgentName = (agentId?: string | null) =>
    agentId ? agentNamesById[agentId] ?? formatShortId(agentId) : "Chưa phân công";

  const selectedRequest =
    availableRequests.find((item) => item.id === requestId) ?? null;

  const load = async () => {
    if (!session) {
      return;
    }
    try {
      const [feedbackData, requestData, agentData] = await Promise.all([
        graphqlRequest<MyFeedbackResponse>(
          MY_FEEDBACKS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<CompletedRequestsResponse, { status?: string | null }>(
          MY_REQUESTS_QUERY,
          { status: "COMPLETED" },
          session.accessToken
        ),
        graphqlRequest<ServiceAgentsResponse>(
          SERVICE_AGENTS_QUERY,
          undefined,
          session.accessToken
        )
      ]);

      setItems(feedbackData.getMyServiceFeedbacks);
      setCompletedRequests(requestData.getMyServiceRequests);
      setAgentNamesById(
        Object.fromEntries(agentData.getServiceAgents.map((agent) => [agent.id, agent.fullName]))
      );
      const availableRequestIds = requestData.getMyServiceRequests
        .filter(
          (request) =>
            !feedbackData.getMyServiceFeedbacks.some(
              (feedback) => feedback.serviceRequestId === request.id
            )
        )
        .map((request) => request.id);

      setRequestId((current) => {
        const routeRequestId = route.params?.requestId;

        if (current && availableRequestIds.includes(current)) {
          return current;
        }

        if (routeRequestId && availableRequestIds.includes(routeRequestId)) {
          return routeRequestId;
        }

        return availableRequestIds[0] ?? "";
      });
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  // Sync requestId when navigated with params (e.g. from MyRequests)
  useEffect(() => {
    if (route.params?.requestId) {
      const nextRequestId = route.params.requestId;
      if (availableRequests.some((item) => item.id === nextRequestId)) {
        setRequestId(nextRequestId);
        setError("");
      } else if (reviewedRequestIds.has(nextRequestId)) {
        setError("Yêu cầu này đã được đánh giá rồi.");
      } else {
        setError("Chỉ có thể đánh giá các yêu cầu đã hoàn thành.");
      }
      // Reset param to avoid re-setting on subsequent focus
      navigation.setParams({ requestId: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRequests, navigation, reviewedRequestIds, route.params?.requestId]);

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
      setError("Hãy chọn một yêu cầu đã hoàn thành để đánh giá");
      return;
    }
    if (reviewedRequestIds.has(requestId.trim())) {
      setError("Yêu cầu này đã được đánh giá rồi.");
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
        <Text style={styles.rowMeta}>Chọn yêu cầu đã hoàn thành và chưa đánh giá.</Text>
        {availableRequests.map((item) => {
          const active = item.id === requestId;

          return (
            <Pressable
              key={item.id}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => setRequestId(item.id)}
            >
              <Text style={styles.rowTitle}>{item.description}</Text>
              <Text style={styles.rowMeta}>Mã: {formatShortId(item.id)}</Text>
              <Text style={styles.rowMeta}>
                Tạo yêu cầu lúc: {formatDateTime(item.createdAt)}
              </Text>
              <Text style={styles.rowMeta}>
                Thợ sửa chữa: {getAgentName(item.assignedProviderId)}
              </Text>
            </Pressable>
          );
        })}
        {!completedRequests.length ? (
          <Text style={styles.rowMeta}>Chưa có yêu cầu hoàn thành nào để đánh giá.</Text>
        ) : !availableRequests.length ? (
          <Text style={styles.rowMeta}>
            Tất cả yêu cầu hoàn thành của bạn đã được đánh giá.
          </Text>
        ) : null}
        {selectedRequest ? (
          <Text style={styles.selectedText}>
            Đang đánh giá: {selectedRequest.description} · Thợ:{" "}
            {getAgentName(selectedRequest.assignedProviderId)}
          </Text>
        ) : null}
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
          disabled={busy || !requestId}
        />
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Đánh giá của tôi ({items.length})</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.rowTitle}>
              Yêu cầu: {requestLabelsById[item.serviceRequestId] ?? formatShortId(item.serviceRequestId)}
            </Text>
            <Text style={styles.rowMeta}>Mã: {formatShortId(item.serviceRequestId)}</Text>
            <Text style={styles.rowMeta}>
              Thợ sửa chữa:{" "}
              {getAgentName(
                completedRequests.find((request) => request.id === item.serviceRequestId)
                  ?.assignedProviderId
              )}
            </Text>
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
  rowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  rowTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 12
  },
  selectedText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700"
  }
});
