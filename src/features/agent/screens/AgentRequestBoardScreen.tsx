import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
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
  formatShortId,
  normalizeServiceRequests
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
  { label: "Chờ AI", value: "AWAITING_ANALYSIS" },
  { label: "Mới tạo", value: "CREATED" },
  { label: "Chờ duyệt", value: "PENDING_REVIEW" },
  { label: "Đã duyệt", value: "APPROVED" },
  { label: "Đã phân công", value: "ASSIGNED" },
  { label: "Đang làm", value: "IN_PROGRESS" }
] as const;

const STATUS_COLORS: Partial<Record<string, { bg: string; text: string }>> = {
  COMPLETED: { bg: "#eff6ff", text: "#2563eb" },
  CANCELLED: { bg: "#f0f4ff", text: "#94a3b8" },
  ASSIGNED: { bg: "#eff6ff", text: "#2563eb" },
  IN_PROGRESS: { bg: "#fefce8", text: "#ca8a04" }
};

export default function AgentRequestBoardScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [matches, setMatches] = useState<MatchingResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    if (selectedStatuses.length === 0) {
      return items.filter((item) => item.status !== "CANCELLED" && item.status !== "COMPLETED");
    }
    return items.filter((item) => selectedStatuses.includes(item.status) && item.status !== "CANCELLED" && item.status !== "COMPLETED");
  }, [items, selectedStatuses]);

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
      setItems(normalizeServiceRequests(requestData.getServiceRequests));
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

  const toggleStatus = (value: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

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
              <Text style={styles.headerTitle}>Bảng yêu cầu</Text>
              <Text style={styles.headerSub}>Tra cứu và xem thông tin yêu cầu dịch vụ</Text>
            </View>
          </View>
        </View>

        {/* Filter chips */}
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

        {/* Error / Loading */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}><MaterialIcons name="warning-amber" size={14} color={colors.danger} /> {error}</Text>
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
            const serviceName = item.serviceDefinitionId
              ? serviceNamesById[item.serviceDefinitionId] ?? "Dịch vụ"
              : "Dịch vụ";
            return (
              <Pressable
                key={item.id}
                style={[styles.requestRow, isSelected && styles.requestRowSelected]}
                onPress={() => void loadLinkedData(item.id)}
              >
                <View style={styles.requestRowHeader}>
                  <Text style={styles.requestDesc} numberOfLines={2}>{serviceName}</Text>
                  <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>
                      {formatRequestStatus(item.status)}
                    </Text>
                  </View>
                </View>
                <View style={styles.requestMeta}>
                  <Text style={styles.metaText}>{item.description}</Text>
                  <Text style={styles.metaText}><MaterialIcons name="schedule" size={12} color="#64748b" /> {formatDateTime(item.createdAt)}</Text>
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
                {selectedRequest.serviceDefinitionId ? (
                  <Text style={styles.detailDesc}>
                    {serviceNamesById[selectedRequest.serviceDefinitionId] ?? formatShortId(selectedRequest.serviceDefinitionId)}
                  </Text>
                ) : null}
                <Text style={styles.metaText}>{selectedRequest.description}</Text>
                <View style={styles.detailGrid}>
                  <Text style={styles.metaText}><MaterialIcons name="person-outline" size={14} color="#64748b" /> {customerProfile?.fullName ?? "-"}</Text>
                  <Text style={styles.metaText}><MaterialIcons name="phone" size={14} color="#64748b" /> {customerProfile?.phoneNumber || "-"}</Text>
                  <Text style={styles.metaText}>
                    <MaterialIcons name="place" size={14} color="#64748b" /> {selectedRequest.addressText || "Chưa nhập địa chỉ"}
                  </Text>
                  <Text style={styles.metaText}><MaterialIcons name="schedule" size={14} color="#64748b" /> {formatDateTime(selectedRequest.createdAt)}</Text>
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
            label={loading ? "Đang tải..." : "Tải Lại"}
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

  header: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    gap: 14,
    alignItems: "flex-start",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 8,
    marginHorizontal: 20
  },
  headerLeft: { flexDirection: "row", gap: 12, flex: 1, alignItems: "flex-start" },
  logoBox: { width: 50, height: 50, borderRadius: 14, overflow: "hidden", flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  dropdownContainer: {
    paddingHorizontal: 20,
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

