import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { RouteProp } from "@react-navigation/native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

const STARS = [1, 2, 3, 4, 5] as const;

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
    () => Object.fromEntries(completedRequests.map((item) => [item.id, item.description])),
    [completedRequests]
  );

  const getAgentName = (agentId?: string | null) =>
    agentId ? agentNamesById[agentId] ?? formatShortId(agentId) : "Chưa phân công";

  const selectedRequest =
    availableRequests.find((item) => item.id === requestId) ?? null;

  const load = async () => {
    if (!session) return;
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
      const availableIds = requestData.getMyServiceRequests
        .filter(
          (req) =>
            !feedbackData.getMyServiceFeedbacks.some(
              (fb) => fb.serviceRequestId === req.id
            )
        )
        .map((req) => req.id);

      setRequestId((current) => {
        const routeReqId = route.params?.requestId;
        if (current && availableIds.includes(current)) return current;
        if (routeReqId && availableIds.includes(routeReqId)) return routeReqId;
        return availableIds[0] ?? "";
      });
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (route.params?.requestId) {
      const nextId = route.params.requestId;
      if (availableRequests.some((item) => item.id === nextId)) {
        setRequestId(nextId);
        setError("");
      } else if (reviewedRequestIds.has(nextId)) {
        setError("Yêu cầu này đã được đánh giá rồi.");
      } else {
        setError("Chỉ có thể đánh giá các yêu cầu đã hoàn thành.");
      }
      navigation.setParams({ requestId: undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableRequests, navigation, reviewedRequestIds, route.params?.requestId]);

  const handleCreate = async () => {
    if (!session) return;
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
      setSuccess(`Đã gửi đánh giá thành công. Mã: ${feedbackId}`);
      setRequestId("");
      setComment("");
      await load();
    } catch (createError) {
      setError(asErrorMessage(createError));
    } finally {
      setBusy(false);
    }
  };

  const ratingNum = Number.parseInt(rating, 10);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Đánh giá dịch vụ ⭐</Text>
          <Text style={styles.headerSub}>Gửi phản hồi sau khi yêu cầu hoàn thành</Text>
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>💡 Chỉ đánh giá yêu cầu đã hoàn thành · 5 sao = Rất hài lòng</Text>
        </View>

        {/* Create feedback card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tạo đánh giá mới</Text>

          {/* Request selector */}
          {availableRequests.length > 0 ? (
            <View style={styles.requestList}>
              {availableRequests.map((item) => {
                const active = item.id === requestId;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.requestRow, active && styles.requestRowActive]}
                    onPress={() => setRequestId(item.id)}
                  >
                    <View style={styles.requestRowLeft}>
                      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                        {active && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.requestDesc} numberOfLines={1}>
                          {item.description}
                        </Text>
                        <Text style={styles.requestMeta}>
                          {formatDateTime(item.assignedProviderId ? item.createdAt : item.createdAt)} · Thợ: {getAgentName(item.assignedProviderId)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {completedRequests.length === 0
                  ? "Chưa có yêu cầu hoàn thành nào"
                  : "Tất cả yêu cầu đã được đánh giá 🎉"}
              </Text>
            </View>
          )}

          {selectedRequest && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>
                ✅ Đang đánh giá: {selectedRequest.description}
              </Text>
            </View>
          )}

          {/* Star rating */}
          <View>
            <Text style={styles.fieldLabel}>Điểm đánh giá</Text>
            <View style={styles.starsRow}>
              {STARS.map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(String(star))}
                  style={styles.starBtn}
                >
                  <Text style={[styles.starIcon, star <= ratingNum && styles.starActive]}>
                    ★
                  </Text>
                </Pressable>
              ))}
              <Text style={styles.ratingLabel}>{ratingNum}/5</Text>
            </View>
          </View>

          {/* Comment */}
          <View>
            <Text style={styles.fieldLabel}>Nhận xét (tuỳ chọn)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Ví dụ: đến đúng giờ, xử lý nhanh, thái độ tốt..."
              placeholderTextColor="#94a3b8"
              value={comment}
              onChangeText={setComment}
              multiline
            />
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}
          {!!success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ {success}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              (busy || !requestId || pressed) && styles.submitBtnDisabled
            ]}
            onPress={() => void handleCreate()}
            disabled={busy || !requestId}
          >
            {busy ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>Gửi đánh giá ✈️</Text>
            )}
          </Pressable>
        </View>

        {/* My feedbacks */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Đánh giá của tôi ({items.length})</Text>
          {items.length === 0 ? (
            <Text style={styles.emptyText}>Bạn chưa gửi đánh giá nào</Text>
          ) : (
            <View style={styles.feedbackList}>
              {items.map((item) => (
                <View key={item.id} style={styles.feedbackItem}>
                  <View style={styles.feedbackHeader}>
                    <Text style={styles.feedbackReqDesc} numberOfLines={1}>
                      {requestLabelsById[item.serviceRequestId] ?? formatShortId(item.serviceRequestId)}
                    </Text>
                    <View style={styles.ratingPill}>
                      <Text style={styles.ratingPillText}>⭐ {item.rating}/5</Text>
                    </View>
                  </View>
                  <Text style={styles.feedbackMeta}>
                    Thợ: {getAgentName(
                      completedRequests.find((r) => r.id === item.serviceRequestId)?.assignedProviderId
                    )}
                  </Text>
                  {item.comment ? (
                    <Text style={styles.feedbackComment}>"{item.comment}"</Text>
                  ) : null}
                  <Text style={styles.feedbackDate}>{formatDateTime(item.createdAt)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4ff" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, gap: 16 },

  header: { gap: 4 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 13, color: "#64748b" },

  noteCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 14,
    padding: 12
  },
  noteText: { fontSize: 13, color: "#1e40af", fontWeight: "600" },

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
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },

  requestList: { gap: 8 },
  requestRow: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#f0f4ff"
  },
  requestRowActive: {
    borderColor: colors.primary,
    backgroundColor: "#eff6ff"
  },
  requestRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  radioOuterActive: { borderColor: colors.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary
  },
  requestDesc: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  requestMeta: { fontSize: 11, color: "#94a3b8", marginTop: 2 },

  emptyCard: { padding: 20, alignItems: "center" },
  emptyText: { color: "#94a3b8", fontSize: 13 },

  selectedBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe"
  },
  selectedBadgeText: { fontSize: 12, color: "#1d4ed8", fontWeight: "700" },

  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  starsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  starBtn: { padding: 2 },
  starIcon: { fontSize: 28, color: "#e2e8f0" },
  starActive: { color: "#f59e0b" },
  ratingLabel: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginLeft: 8 },

  commentInput: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    fontSize: 14,
    color: "#0f172a",
    minHeight: 90,
    textAlignVertical: "top",
    marginTop: 8
  },

  errorBox: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12
  },
  errorText: { fontSize: 13, color: colors.danger },
  successBox: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 12,
    padding: 12
  },
  successText: { fontSize: 13, color: "#1d4ed8", fontWeight: "600" },

  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "800" },

  feedbackList: { gap: 12 },
  feedbackItem: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    gap: 6
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  feedbackReqDesc: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0f172a" },
  ratingPill: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 8
  },
  ratingPillText: { fontSize: 11, fontWeight: "800", color: "#92400e" },
  feedbackMeta: { fontSize: 12, color: "#64748b" },
  feedbackComment: {
    fontSize: 13,
    color: "#0f172a",
    fontStyle: "italic",
    lineHeight: 20
  },
  feedbackDate: { fontSize: 11, color: "#94a3b8" }
});
