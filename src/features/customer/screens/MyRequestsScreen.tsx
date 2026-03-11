import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import type { CustomerTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { cancelServiceRequest } from "../api/customerApi";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { ApiError } from "../../../shared/api/httpClient";
import {
  ACTIVITY_LOGS_BY_REQUEST_QUERY,
  FEEDBACK_BY_REQUEST_QUERY,
  MY_FEEDBACKS_QUERY,
  MY_REQUESTS_QUERY,
  REQUEST_BY_ID_QUERY,
  SERVICE_AGENTS_QUERY,
  SERVICE_DEFINITIONS_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime,
  formatRequestStatus,
  formatShortId
} from "../../../shared/utils/format";
import type {
  ActivityLogItem,
  ServiceAgentItem,
  ServiceFeedbackItem,
  ServiceDefinition,
  ServiceRequestItem
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface MyRequestsResponse {
  getMyServiceRequests: ServiceRequestItem[];
}

interface RequestByIdResponse {
  getServiceRequestById: ServiceRequestItem | null;
}

interface FeedbackByRequestResponse {
  getFeedbackByServiceRequestId: ServiceFeedbackItem[];
  getAverageRatingByServiceRequestId: number;
}

interface MyFeedbacksResponse {
  getMyServiceFeedbacks: ServiceFeedbackItem[];
}

interface ActivityByRequestResponse {
  getActivityLogsByServiceRequestId: ActivityLogItem[];
}

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

const filters = [
  { label: "Tất cả", value: null },
  { label: "Chờ AI", value: "AWAITING_ANALYSIS" },
  { label: "Mới tạo", value: "CREATED" },
  { label: "Khẩn cấp", value: "URGENT_DISPATCH" },
  { label: "Chờ duyệt", value: "PENDING_REVIEW" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Đã phân công", value: "ASSIGNED" },
  { label: "Đang làm", value: "IN_PROGRESS" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đã hủy", value: "CANCELLED" }
] as const;

const canCancelBeforeStaffConfirmation = (status?: string | null) =>
  status === "AWAITING_ANALYSIS" || status === "CREATED" || status === "URGENT_DISPATCH";

export default function MyRequestsScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [detailRequestId, setDetailRequestId] = useState("");
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [detailFeedbacks, setDetailFeedbacks] = useState<ServiceFeedbackItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [agentNamesById, setAgentNamesById] = useState<Record<string, string>>({});
  const [reviewedRequestIds, setReviewedRequestIds] = useState<string[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelingRequestId, setCancelingRequestId] = useState("");
  const [error, setError] = useState("");

  const getAgentName = (agentId?: string | null) =>
    agentId ? agentNamesById[agentId] ?? formatShortId(agentId) : "Chưa phân công";

  const formatActivityForCustomer = (log: ActivityLogItem) => {
    const assignedMatch = /^Staff assigned provider ([\w-]+) with assignment ([\w-]+)$/i.exec(
      log.action
    );
    if (assignedMatch) {
      return `Nhân viên điều phối đã phân công thợ ${getAgentName(assignedMatch[1])}.`;
    }

    const matchingMatch = /^Staff created matching result ([\w-]+) for agent ([\w-]+)$/i.exec(
      log.action
    );
    if (matchingMatch) {
      return `Nhân viên điều phối đã ghép thợ ${getAgentName(matchingMatch[2])} cho yêu cầu.`;
    }

    const evaluatedMatch = /^Staff evaluated complexity (\d+) before dispatch$/i.exec(log.action);
    if (evaluatedMatch) {
      return `Nhân viên điều phối đã đánh giá độ phức tạp mức ${evaluatedMatch[1]}.`;
    }

    const agentStartedMatch = /^Agent ([\w-]+) started work$/i.exec(log.action);
    if (agentStartedMatch) {
      return `Thợ sửa chữa ${getAgentName(agentStartedMatch[1])} đã bắt đầu công việc.`;
    }

    const agentCompletedMatch = /^Agent ([\w-]+) completed work$/i.exec(log.action);
    if (agentCompletedMatch) {
      return `Thợ sửa chữa ${getAgentName(agentCompletedMatch[1])} đã hoàn thành công việc.`;
    }

    return log.action;
  };

  const load = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [requestData, serviceData, feedbackData, agentData] = await Promise.all([
        graphqlRequest<MyRequestsResponse, { status?: string | null }>(
          MY_REQUESTS_QUERY,
          { status: statusFilter },
          session.accessToken
        ),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY),
        graphqlRequest<MyFeedbacksResponse>(
          MY_FEEDBACKS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<ServiceAgentsResponse>(
          SERVICE_AGENTS_QUERY,
          undefined,
          session.accessToken
        )
      ]);

      setItems(requestData.getMyServiceRequests);
      setServiceNamesById(
        Object.fromEntries(serviceData.getServiceDefinitions.map((service) => [service.id, service.name]))
      );
      setAgentNamesById(
        Object.fromEntries(agentData.getServiceAgents.map((agent) => [agent.id, agent.fullName]))
      );
      setReviewedRequestIds(
        Array.from(
          new Set(feedbackData.getMyServiceFeedbacks.map((feedback) => feedback.serviceRequestId))
        )
      );
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async (requestedId?: string) => {
    if (!session) {
      return;
    }
    const requestId = requestedId ?? detailRequestId;

    if (!requestId.trim()) {
      setError("Hãy chọn một yêu cầu từ danh sách phía trên");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [requestData, feedbackData, activityData] = await Promise.all([
        graphqlRequest<RequestByIdResponse, { id: string }>(
          REQUEST_BY_ID_QUERY,
          { id: requestId.trim() },
          session.accessToken
        ),
        graphqlRequest<FeedbackByRequestResponse, { serviceRequestId: string }>(
          FEEDBACK_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        ),
        graphqlRequest<ActivityByRequestResponse, { serviceRequestId: string }>(
          ACTIVITY_LOGS_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        )
      ]);

      setDetailRequestId(requestId.trim());
      setDetail(requestData.getServiceRequestById);
      setDetailFeedbacks(feedbackData.getFeedbackByServiceRequestId);
      setAverageRating(feedbackData.getAverageRatingByServiceRequestId);
      setActivityLogs(activityData.getActivityLogsByServiceRequestId);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const performCancelRequest = async (requestId: string) => {
    if (!session) {
      return;
    }

    setCancelingRequestId(requestId);
    setError("");
    try {
      await cancelServiceRequest(session.accessToken, requestId);
      setDetail((current) =>
        current?.id === requestId ? { ...current, status: "CANCELLED" } : current
      );
      await load();
      Alert.alert("Đã hủy yêu cầu", "Yêu cầu của bạn đã được hủy.");
    } catch (cancelError) {
      const message = asErrorMessage(cancelError);
      setError(message);

      if (cancelError instanceof ApiError && cancelError.status === 409) {
        await load();
        await loadRequestDetail(requestId);
        Alert.alert("Không thể hủy", message);
      }
    } finally {
      setCancelingRequestId("");
    }
  };

  const confirmCancelRequest = (requestId: string) => {
    Alert.alert(
      "Hủy yêu cầu",
      "Bạn chỉ có thể hủy trước khi staff xác nhận độ phức tạp. Xác nhận hủy yêu cầu này?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Hủy yêu cầu",
          style: "destructive",
          onPress: () => {
            void performCancelRequest(requestId);
          }
        }
      ]
    );
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, session?.accessToken]);

  useEffect(() => {
    if (items.length === 0) {
      setDetailRequestId("");
      setDetail(null);
      setDetailFeedbacks([]);
      setActivityLogs([]);
      setAverageRating(null);
      return;
    }

    const stillVisible = items.some((item) => item.id === detailRequestId);
    if (!stillVisible) {
      void loadRequestDetail(items[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <ScreenLayout
      title="Yêu cầu của tôi"
      subtitle="Theo dõi trạng thái, chi phí ước tính và xem chi tiết từng yêu cầu"
    >
      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = filter.value === statusFilter;
          return (
            <Pressable
              key={filter.label}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(filter.value)}
            >
              <Text
                style={[styles.filterChipText, active && styles.filterChipTextActive]}
              >
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? <Text style={styles.loading}>Đang tải dữ liệu...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      {items.map((item) => (
        (() => {
          const isSelected = detailRequestId === item.id;
          const canCancel = canCancelBeforeStaffConfirmation(item.status);

          return (
            <Pressable
              key={item.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => void loadRequestDetail(item.id)}
            >
              <Text style={styles.cardTitle}>{item.description}</Text>
              <Text style={styles.meta}>Trạng thái: {formatRequestStatus(item.status)}</Text>
              {item.serviceDefinitionId ? (
                <Text style={styles.meta}>
                  Dịch vụ:{" "}
                  {serviceNamesById[item.serviceDefinitionId] ??
                    formatShortId(item.serviceDefinitionId)}
                </Text>
              ) : null}
              <Text style={styles.meta}>Tạo lúc: {formatDateTime(item.createdAt)}</Text>
              <Text style={styles.meta}>
                Độ phức tạp: {item.complexity?.level ?? "Chưa đánh giá"}
              </Text>
              <Text style={styles.meta}>
                Chi phí ước tính:{" "}
                {item.estimatedCost
                  ? formatCurrency(item.estimatedCost.amount, item.estimatedCost.currency)
                  : "Chưa có"}
              </Text>
              {item.addressText ? (
                <Text style={styles.meta}>Địa chỉ: {item.addressText}</Text>
              ) : null}
              {item.assignedProviderId ? (
                <Text style={styles.meta}>
                  Thợ sửa chữa: {getAgentName(item.assignedProviderId)}
                </Text>
              ) : null}
              {canCancel ? (
                <>
                  <Text style={styles.cancelHint}>
                    Có thể hủy trước khi staff xác nhận độ phức tạp
                  </Text>
                  {isSelected ? (
                    <ActionButton
                      label={
                        cancelingRequestId === item.id ? "Đang hủy..." : "Hủy yêu cầu này"
                      }
                      onPress={() => confirmCancelRequest(item.id)}
                      disabled={loading || cancelingRequestId.length > 0}
                      variant="danger"
                    />
                  ) : (
                    <Text style={styles.tapHint}>Nhấn vào card này để hiện nút hủy</Text>
                  )}
                </>
              ) : item.status === "COMPLETED" ? (
                reviewedRequestIds.includes(item.id) ? (
                  <Text style={styles.feedbackDone}>Đã gửi đánh giá</Text>
                ) : (
                  <Text
                    style={styles.feedbackHint}
                    onPress={() => {
                      navigation.navigate("Feedback", { requestId: item.id });
                    }}
                  >
                    ★ Gửi đánh giá →
                  </Text>
                )
              ) : (
                <Text style={styles.tapHint}>Nhấn để xem chi tiết</Text>
              )}
            </Pressable>
          );
        })()
      ))}

      {!loading && items.length === 0 ? (
        <Text style={styles.empty}>Chưa có yêu cầu nào theo bộ lọc này</Text>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Chi tiết yêu cầu & đánh giá</Text>
        {detailRequestId ? (
          <Text style={styles.tapHint}>Đang xem: {formatShortId(detailRequestId)}</Text>
        ) : (
          <Text style={styles.meta}>Nhấn vào một yêu cầu phía trên để xem chi tiết.</Text>
        )}
        <ActionButton
          label={loading ? "Đang tải..." : "Tải lại chi tiết đang chọn"}
          onPress={() => void loadRequestDetail(detailRequestId)}
          disabled={loading || !detailRequestId}
          variant="secondary"
        />
        {detail ? (
          <View style={styles.detailBox}>
            <Text style={styles.meta}>Trạng thái: {formatRequestStatus(detail.status)}</Text>
            {detail.serviceDefinitionId ? (
              <Text style={styles.meta}>
                Dịch vụ:{" "}
                {serviceNamesById[detail.serviceDefinitionId] ??
                  formatShortId(detail.serviceDefinitionId)}
              </Text>
            ) : null}
            <Text style={styles.meta}>Mô tả: {detail.description}</Text>
            <Text style={styles.meta}>
              Độ phức tạp: {detail.complexity?.level ?? "Chưa đánh giá"}
            </Text>
            <Text style={styles.meta}>
              Chi phí ước tính:{" "}
              {detail.estimatedCost
                ? formatCurrency(detail.estimatedCost.amount, detail.estimatedCost.currency)
                : "Chưa có"}
            </Text>
            <Text style={styles.meta}>
              Thợ sửa chữa: {getAgentName(detail.assignedProviderId)}
            </Text>
            {canCancelBeforeStaffConfirmation(detail.status) ? (
              <View style={styles.cancelBox}>
                <Text style={styles.meta}>
                  Bạn có thể hủy ở bước này vì staff chưa xác nhận độ phức tạp.
                </Text>
                <ActionButton
                  label={
                    cancelingRequestId === detail.id ? "Đang hủy..." : "Hủy yêu cầu"
                  }
                  onPress={() => confirmCancelRequest(detail.id)}
                  disabled={loading || cancelingRequestId.length > 0}
                  variant="danger"
                />
              </View>
            ) : null}
            {detail.ocrExtractedText ? (
              <Text style={styles.meta}>OCR: {detail.ocrExtractedText}</Text>
            ) : null}
            <Text style={styles.meta}>Điểm trung bình: {averageRating ?? 0}</Text>
            <Text style={styles.meta}>Số lượt đánh giá: {detailFeedbacks.length}</Text>
            <View style={styles.logBox}>
              <Text style={styles.metaStrong}>Nhật ký gần nhất</Text>
              {activityLogs.slice(0, 4).map((log) => (
                <Text key={log.id} style={styles.meta}>
                  • {formatDateTime(log.createdAt)} · {formatActivityForCustomer(log)}
                </Text>
              ))}
              {activityLogs.length === 0 ? (
                <Text style={styles.meta}>Chưa có nhật ký nào cho yêu cầu này</Text>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff"
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600"
  },
  filterChipTextActive: {
    color: colors.primary
  },
  loading: {
    color: colors.textMuted
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 6
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  cardTitle: {
    color: colors.text,
    fontWeight: "700"
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  detailBox: {
    gap: 3,
    marginTop: 8
  },
  cancelBox: {
    gap: 8,
    marginTop: 10,
    marginBottom: 4
  },
  logBox: {
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  metaStrong: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700"
  },
  tapHint: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6
  },
  feedbackHint: {
    color: colors.success,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 6
  },
  cancelHint: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6
  },
  feedbackDone: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6
  },
  empty: {
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 16
  }
});
