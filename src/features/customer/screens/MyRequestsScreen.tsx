import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import type { CustomerTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { cancelServiceRequest } from "../api/customerApi";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { ApiError } from "../../../shared/api/httpClient";
import {
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

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

const statusOptions = [
  { label: "Chờ AI", value: "AWAITING_ANALYSIS" },
  { label: "Mới tạo", value: "CREATED" },
  { label: "Khẩn cấp", value: "URGENT_DISPATCH" },
  { label: "Chờ duyệt", value: "PENDING_REVIEW" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Đã phân công", value: "ASSIGNED" },
  { label: "Đang làm", value: "IN_PROGRESS" },
  { label: "Hoàn thành", value: "COMPLETED" }
] as const;

const canCancelBeforeStaffConfirmation = (status?: string | null) =>
  status === "AWAITING_ANALYSIS" || status === "CREATED" || status === "URGENT_DISPATCH";

export default function MyRequestsScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<CustomerTabParamList>>();
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [detailRequestId, setDetailRequestId] = useState("");
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [detailFeedbacks, setDetailFeedbacks] = useState<ServiceFeedbackItem[]>([]);
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [agentNamesById, setAgentNamesById] = useState<Record<string, string>>({});
  const [reviewedRequestIds, setReviewedRequestIds] = useState<string[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelingRequestId, setCancelingRequestId] = useState("");
  const [error, setError] = useState("");

  const getAgentName = (agentId?: string | null) =>
    agentId ? agentNamesById[agentId] ?? formatShortId(agentId) : "Chưa phân công";

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
          { status: null },
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

  const filteredItems =
    selectedStatuses.length === 0
      ? items.filter((item) => item.status !== "CANCELLED")
      : items.filter((item) => selectedStatuses.includes(item.status) && item.status !== "CANCELLED");

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
      const [requestData, feedbackData] = await Promise.all([
        graphqlRequest<RequestByIdResponse, { id: string }>(
          REQUEST_BY_ID_QUERY,
          { id: requestId.trim() },
          session.accessToken
        ),
        graphqlRequest<FeedbackByRequestResponse, { serviceRequestId: string }>(
          FEEDBACK_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        )
      ]);

      setDetailRequestId(requestId.trim());
      setDetail(requestData.getServiceRequestById);
      setDetailFeedbacks(feedbackData.getFeedbackByServiceRequestId);
      setAverageRating(feedbackData.getAverageRatingByServiceRequestId);
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

  const toggleStatus = (value: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setDetailRequestId("");
      setDetail(null);
      setDetailFeedbacks([]);
      setAverageRating(null);
      return;
    }

    const stillVisible = filteredItems.some((item) => item.id === detailRequestId);
    if (!stillVisible) {
      void loadRequestDetail(filteredItems[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredItems.length, selectedStatuses]);

  const dropdownLabel =
    selectedStatuses.length === 0
      ? "Tất cả trạng thái"
      : `${selectedStatuses.length} trạng thái`;

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
              <Text style={styles.headerTitle}>Yêu cầu của tôi</Text>
              <Text style={styles.headerSub}>Theo dõi trạng thái & chi tiết</Text>
            </View>
          </View>
        </View>

        {/* Status dropdown button */}
        <View style={styles.dropdownContainer}>
        <Pressable
          style={({ pressed }) => [styles.dropdownButton, pressed && styles.dropdownButtonPressed]}
          onPress={() => setDropdownOpen((v) => !v)}
        >
          <Text style={styles.dropdownButtonText}><MaterialIcons name="filter-list" size={14} color="#0f172a" /> {dropdownLabel}</Text>
          <MaterialIcons name={dropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={18} color="#94a3b8" />
        </Pressable>

        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            {selectedStatuses.length > 0 && (
              <Pressable
                style={styles.dropdownClearRow}
                onPress={() => setSelectedStatuses([])}
              >
                <Text style={styles.dropdownClearText}><MaterialIcons name="close" size={12} color={colors.danger} /> Bỏ chọn tất cả</Text>
              </Pressable>
            )}
            {statusOptions.map((opt) => {
              const checked = selectedStatuses.includes(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.dropdownItem, checked && styles.dropdownItemChecked]}
                  onPress={() => toggleStatus(opt.value)}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <MaterialIcons name="check" size={13} color="#fff" />}
                  </View>
                  <Text style={[styles.dropdownItemText, checked && styles.dropdownItemTextChecked]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {loading ? <Text style={styles.loading}>Đang tải dữ liệu...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}

      {filteredItems.map((item) =>
        (() => {
          const isSelected = detailRequestId === item.id;
          const canCancel = canCancelBeforeStaffConfirmation(item.status);
          const serviceName =
            item.serviceDefinitionId
              ? serviceNamesById[item.serviceDefinitionId] ?? "Dịch vụ"
              : "Dịch vụ";

          return (
            <Pressable
              key={item.id}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => void loadRequestDetail(item.id)}
            >
              <Text style={styles.cardTitle}>{serviceName}</Text>
              <Text style={styles.meta}>Tạo lúc: {formatDateTime(item.createdAt)}</Text>
              {canCancel && isSelected ? (
                <>
                  <Text style={styles.cancelHint}>
                    Có thể hủy trước khi staff xác nhận độ phức tạp
                  </Text>
                  <ActionButton
                    label={
                      cancelingRequestId === item.id ? "Đang hủy..." : "Hủy yêu cầu này"
                    }
                    onPress={() => confirmCancelRequest(item.id)}
                    disabled={loading || cancelingRequestId.length > 0}
                    variant="danger"
                  />
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
                    <MaterialIcons name="star" size={14} color="#2563eb" /> Gửi đánh giá <MaterialIcons name="arrow-forward" size={14} color="#2563eb" />
                  </Text>
                )
              ) : (
                <Text style={styles.tapHint}>Nhấn để xem chi tiết</Text>
              )}
            </Pressable>
          );
        })()
      )}

      {!loading && filteredItems.length === 0 ? (
        <Text style={styles.empty}>Chưa có yêu cầu nào theo bộ lọc này</Text>
      ) : null}

      {/* Detail & feedback card */}
      <View style={styles.card}>
        <View style={styles.detailHeader}>
          <Text style={styles.cardTitle}>Chi tiết yêu cầu & đánh giá</Text>
          <Pressable
            style={({ pressed }) => [styles.reloadBtn, pressed && styles.reloadBtnPressed]}
            onPress={() => void loadRequestDetail(detailRequestId)}
            disabled={loading || !detailRequestId}
          >
            <Text style={[styles.reloadBtnText, (!detailRequestId || loading) && styles.reloadBtnDisabled]}>
              {loading ? "Đang tải..." : "Tải lại"}
            </Text>
          </Pressable>
        </View>
        {!detailRequestId ? (
          <Text style={styles.meta}>Nhấn vào một yêu cầu phía trên để xem chi tiết.</Text>
        ) : null}
        {detail ? (
          <View style={styles.detailBox}>
            {detail.serviceDefinitionId ? (
              <Text style={styles.meta}>
                Loại dịch vụ:{" "}
                {serviceNamesById[detail.serviceDefinitionId] ??
                  formatShortId(detail.serviceDefinitionId)}
              </Text>
            ) : null}
            <Text style={styles.meta}>Trạng thái: {formatRequestStatus(detail.status)}</Text>
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
            <Text style={styles.meta}>Điểm trung bình: {averageRating ?? 0}</Text>
            <Text style={styles.meta}>Số lượt đánh giá: {detailFeedbacks.length}</Text>
            {detail.addressText ? (
              <Text style={styles.meta}>Địa chỉ: {detail.addressText}</Text>
            ) : null}
            <Text style={styles.meta}>Thời gian tạo: {formatDateTime(detail.createdAt)}</Text>
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
          </View>
        ) : null}
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

  // Dropdown
  dropdownContainer: {
    zIndex: 10
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  dropdownButtonPressed: {
    backgroundColor: "#f8fafc"
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a"
  },
  dropdownChevron: {
    fontSize: 11,
    color: "#94a3b8"
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  dropdownClearRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    marginBottom: 2
  },
  dropdownClearText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.danger
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10
  },
  dropdownItemChecked: {
    backgroundColor: "#eff6ff"
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b"
  },
  dropdownItemTextChecked: {
    color: colors.primary,
    fontWeight: "700"
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center"
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  checkMark: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800"
  },

  // General
  loading: {
    color: "#64748b",
    fontSize: 13,
    textAlign: "center"
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#fecaca"
  },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#eff6ff"
  },
  cardTitle: {
    color: "#0f172a",
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 20
  },
  meta: {
    color: "#64748b",
    fontSize: 12,
    lineHeight: 18
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  reloadBtn: {
    backgroundColor: "#f0f4ff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  reloadBtnPressed: {
    backgroundColor: "#e0e7ff"
  },
  reloadBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary
  },
  reloadBtnDisabled: {
    color: "#94a3b8"
  },
  detailBox: {
    gap: 6,
    marginTop: 8
  },
  cancelBox: {
    gap: 8,
    marginTop: 10,
    marginBottom: 4
  },
  tapHint: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  feedbackHint: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4
  },
  cancelHint: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  feedbackDone: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  empty: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20,
    fontSize: 13
  }
});
