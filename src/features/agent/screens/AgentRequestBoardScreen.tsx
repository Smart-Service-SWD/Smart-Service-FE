import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY,
  ASSIGNMENTS_BY_REQUEST_QUERY,
  MATCHING_RESULTS_BY_REQUEST_QUERY,
  SERVICE_DEFINITIONS_QUERY,
  USER_BY_ID_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatDateTime,
  formatRequestStatus,
  formatShortId
} from "../../../shared/utils/format";
import type {
  AssignmentItem,
  MatchingResultItem,
  ServiceDefinition,
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface AssignmentByRequestResponse {
  getAssignmentsByServiceRequestId: AssignmentItem[];
}

interface MatchingByRequestResponse {
  getMatchingResultsByServiceRequestId: MatchingResultItem[];
}

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

interface UserByIdResponse {
  getUserById: UserProfile | null;
}

const statusOptions = [
  "ALL",
  "AWAITING_ANALYSIS",
  "CREATED",
  "URGENT_DISPATCH",
  "PENDING_REVIEW",
  "APPROVED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
] as const;

const STATUS_LABELS: Record<(typeof statusOptions)[number], string> = {
  ALL: "Tất cả",
  AWAITING_ANALYSIS: "Chờ AI",
  CREATED: "Mới",
  URGENT_DISPATCH: "Khẩn",
  PENDING_REVIEW: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  ASSIGNED: "Đã gán",
  IN_PROGRESS: "Đang làm",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy"
};

const STATUS_COLORS: Partial<Record<string, { bg: string; text: string }>> = {
  URGENT_DISPATCH: { bg: "#fef2f2", text: "#dc2626" },
  COMPLETED: { bg: "#eff6ff", text: "#2563eb" },
  CANCELLED: { bg: "#f0f4ff", text: "#94a3b8" },
  ASSIGNED: { bg: "#eff6ff", text: "#2563eb" },
  IN_PROGRESS: { bg: "#fefce8", text: "#ca8a04" }
};

export default function AgentRequestBoardScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [matches, setMatches] = useState<MatchingResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") return items;
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const selectedRequest = useMemo(
    () => items.find((item) => item.id === selectedRequestId) ?? null,
    [items, selectedRequestId]
  );

  const loadBoard = async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [requestData, serviceData] = await Promise.all([
        graphqlRequest<AllRequestsResponse>(
          ALL_REQUESTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY)
      ]);
      setItems(requestData.getServiceRequests);
      setServiceNamesById(
        Object.fromEntries(serviceData.getServiceDefinitions.map((service) => [service.id, service.name]))
      );
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedData = async (requestedId?: string) => {
    if (!session) return;
    const requestId = requestedId ?? selectedRequestId;
    if (!requestId.trim()) {
      setError("Hãy chọn một yêu cầu từ danh sách");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const request = items.find((item) => item.id === requestId.trim()) ?? null;
      const [assignmentData, matchingData, userData] = await Promise.all([
        graphqlRequest<AssignmentByRequestResponse, { serviceRequestId: string }>(
          ASSIGNMENTS_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        ),
        graphqlRequest<MatchingByRequestResponse, { serviceRequestId: string }>(
          MATCHING_RESULTS_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        ),
        request?.customerId
          ? graphqlRequest<UserByIdResponse, { id: string }>(
            USER_BY_ID_QUERY,
            { id: request.customerId },
            session.accessToken
          )
          : Promise.resolve<UserByIdResponse | null>(null)
      ]);
      setSelectedRequestId(requestId.trim());
      setAssignments(assignmentData.getAssignmentsByServiceRequestId);
      setMatches(matchingData.getMatchingResultsByServiceRequestId);
      setCustomerProfile(userData?.getUserById ?? null);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRequest) return;
    setCustomerProfile(null);
  }, [selectedRequest]);

  useEffect(() => {
    void loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const getStatusStyle = (status: string) => STATUS_COLORS[status] ?? { bg: "#f0f4ff", text: "#64748b" };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bảng yêu cầu</Text>
          <Text style={styles.headerSub}>Tra cứu và xem thông tin yêu cầu dịch vụ</Text>
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {statusOptions.map((opt) => {
            const active = statusFilter === opt;
            return (
              <Pressable
                key={opt}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(opt)}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {STATUS_LABELS[opt]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Error / Loading */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}
        {loading && !selectedRequestId && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}

        {/* Request list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yêu cầu ({filteredItems.length})</Text>
          {filteredItems.slice(0, 25).map((item) => {
            const status = getStatusStyle(item.status);
            const isSelected = selectedRequestId === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.requestRow, isSelected && styles.requestRowSelected]}
                onPress={() => void loadLinkedData(item.id)}
              >
                <View style={styles.requestRowHeader}>
                  <Text style={styles.requestDesc} numberOfLines={2}>{item.description}</Text>
                  <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>
                      {formatRequestStatus(item.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestMeta}>
                  <Text style={styles.metaText}>🆔 {formatShortId(item.id)}</Text>
                  <Text style={styles.metaText}>🕐 {formatDateTime(item.createdAt)}</Text>
                  {item.serviceDefinitionId ? (
                    <Text style={styles.metaText}>
                      🛠 {serviceNamesById[item.serviceDefinitionId] ?? formatShortId(item.serviceDefinitionId)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
          {!loading && filteredItems.length === 0 && (
            <Text style={styles.emptyText}>Không có yêu cầu nào</Text>
          )}
        </View>

        {/* Detail panel */}
        <View style={styles.card}>
          <View style={styles.detailHeader}>
            <Text style={styles.cardTitle}>Chi tiết & Matching</Text>
            {loading && selectedRequestId ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : null}
          </View>

          {selectedRequest ? (
            <>
              <View style={styles.detailInfo}>
                <Text style={styles.detailDesc}>{selectedRequest.description}</Text>
                <View style={styles.detailGrid}>
                  <Text style={styles.metaText}>👤 {customerProfile?.fullName ?? "-"}</Text>
                  <Text style={styles.metaText}>📞 {customerProfile?.phoneNumber || "-"}</Text>
                  <Text style={styles.metaText}>
                    📍 {selectedRequest.addressText || "Chưa nhập địa chỉ"}
                  </Text>
                  {selectedRequest.serviceDefinitionId ? (
                    <Text style={styles.metaText}>
                      🛠 {serviceNamesById[selectedRequest.serviceDefinitionId] ?? formatShortId(selectedRequest.serviceDefinitionId)}
                    </Text>
                  ) : null}
                  <Text style={styles.metaText}>🕐 {formatDateTime(selectedRequest.createdAt)}</Text>
                </View>
              </View>
              <View style={styles.countRow}>
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>{assignments.length}</Text>
                  <Text style={styles.countLabel}>Công việc</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>{matches.length}</Text>
                  <Text style={styles.countLabel}>Matching</Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>Nhấn vào yêu cầu phía trên để xem chi tiết</Text>
          )}

          <ActionButton
            label={loading ? "Đang tải..." : "Tải dữ liệu liên kết"}
            onPress={() => void loadLinkedData(selectedRequestId)}
            disabled={loading || !selectedRequestId}
            variant="secondary"
          />
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4ff" },
  scroll: { flex: 1 },
  content: { paddingTop: 16, paddingBottom: 20, gap: 14 },

  header: { paddingHorizontal: 20, gap: 4 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a" },
  headerSub: { fontSize: 13, color: "#64748b" },

  filterScroll: { paddingHorizontal: 20, gap: 8 },
  filterChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#fff"
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  filterText: { fontSize: 12, color: "#64748b", fontWeight: "700" },
  filterTextActive: { color: colors.primary },

  errorBox: {
    marginHorizontal: 20,
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12
  },
  errorText: { fontSize: 13, color: colors.danger },
  loadingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: "#64748b" },

  card: {
    marginHorizontal: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },

  requestRow: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 8
  },
  requestRowSelected: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  requestRowHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  requestDesc: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0f172a", lineHeight: 19 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  statusText: { fontSize: 10, fontWeight: "800" },
  requestMeta: { gap: 3 },
  metaText: { fontSize: 11, color: "#64748b" },

  detailHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailInfo: { gap: 8 },
  detailDesc: { fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },
  detailGrid: { gap: 4 },

  countRow: { flexDirection: "row", gap: 12 },
  countBadge: {
    flex: 1,
    backgroundColor: "#f0f4ff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  countNumber: { fontSize: 24, fontWeight: "800", color: colors.primary },
  countLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center", paddingVertical: 8 }
});
