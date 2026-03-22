import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import type { StaffTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { ALL_REQUESTS_QUERY, SERVICE_AGENTS_QUERY, SERVICE_DEFINITIONS_QUERY, USERS_QUERY } from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime,
  formatRequestStatus,
  formatShortId,
  normalizeServiceRequests
} from "../../../shared/utils/format";
import type { ServiceAgentItem, ServiceDefinition, ServiceRequestItem, UserProfile } from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

interface UsersResponse {
  getUsers: UserProfile[];
}

const statusOptions = [
  "CREATED",
  "PENDING_REVIEW",
  "ASSIGNED",
  "COMPLETED"
] as const;

const statusLabels: Record<(typeof statusOptions)[number], string> = {
  CREATED: "Mới tạo",
  PENDING_REVIEW: "Sẵn sàng điều phối",
  ASSIGNED: "Đã phân công",
  COMPLETED: "Hoàn thành"
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_REVIEW: { bg: "#fefce8", text: "#ca8a04" },
  COMPLETED: { bg: "#f0fdf4", text: "#16a34a" },
  ASSIGNED: { bg: "#eff6ff", text: "#2563eb" }
};

const canOpenDispatch = (request: ServiceRequestItem | null) =>
  request?.status === "CREATED" || request?.status === "PENDING_REVIEW";

const getStatusStyle = (status?: string | null) =>
  STATUS_COLORS[status ?? ""] ?? { bg: "#f0f4ff", text: "#64748b" };

const getAiValueLabel = (value?: string | null, wasAnalyzedByAI?: boolean) => {
  if (value?.trim()) return value;
  return wasAnalyzedByAI ? "AI chưa trả về" : "Chưa phân tích AI";
};

export default function ReviewQueueScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<StaffTabParamList>>();
  const { session } = useAuth();

  // ✅ NEW: multi-select statuses
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [customerNamesById, setCustomerNamesById] = useState<Record<string, string>>({});
  const [agentNamesById, setAgentNamesById] = useState<Record<string, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    if (selectedStatuses.length === 0) return items;
    return items.filter((item) => selectedStatuses.includes(item.status));
  }, [items, selectedStatuses]);

  const actionableCount = useMemo(
    () =>
      items.filter(
        (item) =>
          item.status === "CREATED" ||
          item.status === "PENDING_REVIEW"
      ).length,
    [items]
  );

  const getCustomerName = (customerId?: string | null) =>
    customerId ? customerNamesById[customerId] ?? formatShortId(customerId) : "-";

  const getAssignedAgentName = (agentId?: string | null) =>
    agentId ? agentNamesById[agentId] ?? formatShortId(agentId) : "Chưa gán";

  const toggleStatus = (value: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const dropdownLabel =
    selectedStatuses.length === 0 ? "Tất cả trạng thái" : `${selectedStatuses.length} trạng thái`;

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [requestData, serviceData, userData, agentData] = await Promise.all([
        graphqlRequest<AllRequestsResponse>(ALL_REQUESTS_QUERY, undefined, session.accessToken),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY),
        graphqlRequest<UsersResponse>(USERS_QUERY, undefined, session.accessToken),
        graphqlRequest<ServiceAgentsResponse>(SERVICE_AGENTS_QUERY, undefined, session.accessToken)
      ]);

      setItems(normalizeServiceRequests(requestData.getServiceRequests));

      setServiceNamesById(
        Object.fromEntries(serviceData.getServiceDefinitions.map((service) => [service.id, service.name]))
      );

      setCustomerNamesById(
        Object.fromEntries(userData.getUsers.map((user) => [user.id, user.fullName]))
      );

      setAgentNamesById(
        Object.fromEntries(agentData.getServiceAgents.map((agent) => [agent.id, agent.fullName]))
      );
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Yêu cầu chờ xử lý</Text>
              <Text style={styles.headerSub}>Xem và mở điều phối từng đơn</Text>
            </View>
          </View>
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              <MaterialIcons name="warning-amber" size={14} color={colors.danger} /> {error}
            </Text>
          </View>
        )}
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}

        {/* Overview metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan hàng chờ</Text>
          <View style={styles.countRow}>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{actionableCount}</Text>
              <Text style={styles.countLabel}>Cần xử lý</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{filteredItems.length}</Text>
              <Text style={styles.countLabel}>Đang hiển thị</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{items.length}</Text>
              <Text style={styles.countLabel}>Tổng đơn</Text>
            </View>
          </View>
        </View>

        {/* Filter (dropdown multi select) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bộ lọc trạng thái</Text>

          <View style={styles.dropdownContainer}>
            <Pressable
              style={({ pressed }) => [styles.dropdownButton, pressed && styles.dropdownButtonPressed]}
              onPress={() => setDropdownOpen((v) => !v)}
            >
              <Text style={styles.dropdownButtonText}>
                <MaterialIcons name="filter-list" size={14} color="#0f172a" /> {dropdownLabel}
              </Text>
              <MaterialIcons name={dropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} size={18} color="#94a3b8" />
            </Pressable>

            {dropdownOpen && (
              <View style={styles.dropdownMenu}>
                {selectedStatuses.length > 0 && (
                  <Pressable style={styles.dropdownClearRow} onPress={() => setSelectedStatuses([])}>
                    <Text style={styles.dropdownClearText}>
                      <MaterialIcons name="close" size={12} color={colors.danger} /> Bỏ chọn tất cả
                    </Text>
                  </Pressable>
                )}

                {statusOptions.map((status) => {
                  const checked = selectedStatuses.includes(status);
                  return (
                    <Pressable
                      key={status}
                      style={[styles.dropdownItem, checked && styles.dropdownItemChecked]}
                      onPress={() => toggleStatus(status)}
                    >
                      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                        {checked && <MaterialIcons name="check" size={13} color="#fff" />}
                      </View>
                      <Text style={[styles.dropdownItemText, checked && styles.dropdownItemTextChecked]}>
                        {statusLabels[status]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Request list */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Danh sách yêu cầu ({filteredItems.length})</Text>

          {filteredItems.map((item) => {
            const statusStyle = getStatusStyle(item.status);
            const isSelected = selectedRequestId === item.id;

            return (
              <View key={item.id} style={[styles.requestRow, isSelected && styles.requestRowSelected]}>
                <Pressable style={styles.requestBody} onPress={() => setSelectedRequestId(item.id)}>
                  <View style={styles.requestRowHeader}>
                    <Text style={styles.requestDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                      <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {formatRequestStatus(item.status)}
                      </Text>
                    </View>
                  </View>

                  {item.serviceDefinitionId ? (
                    <Text style={styles.metaText}>
                      Dịch vụ: {serviceNamesById[item.serviceDefinitionId] ?? formatShortId(item.serviceDefinitionId)}
                    </Text>
                  ) : null}

                  <Text style={styles.metaText}>Khách hàng: {getCustomerName(item.customerId)}</Text>
                  <Text style={styles.metaText}>Thợ đã gán: {getAssignedAgentName(item.assignedProviderId)}</Text>
                  <Text style={styles.metaText}>Độ phức tạp: {item.complexity?.level ?? "Chưa có"}</Text>

                  {item.estimatedCost ? (
                    <Text style={styles.metaText}>
                      Chi phí ước tính: {formatCurrency(item.estimatedCost.amount, item.estimatedCost.currency)}
                    </Text>
                  ) : null}

                  <Text style={styles.metaText}>
                    AI báo giá: {getAiValueLabel(item.estimatedPrice, item.wasAnalyzedByAI)}
                  </Text>

                  <View style={styles.badgeRow}>
                    <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                      <Text style={[styles.statusText, { color: "#2563eb" }]}>{formatDateTime(item.createdAt)}</Text>
                    </View>
                  </View>
                </Pressable>

                <View style={styles.requestActions}>
                  {canOpenDispatch(item) ? (
                    <ActionButton
                      label="Mở điều phối"
                      onPress={() => {
                        setSelectedRequestId(item.id);
                        navigation.navigate("DispatchCenter", { requestId: item.id });
                      }}
                    />
                  ) : null}

                  {item.assignedProviderId ? (
                    <ActionButton
                      label="Xem lịch sử"
                      onPress={() => {
                        setSelectedRequestId(item.id);
                        navigation.navigate("DispatchHistory", { requestId: item.id });
                      }}
                      variant="secondary"
                    />
                  ) : null}
                </View>
              </View>
            );
          })}

          {!loading && filteredItems.length === 0 ? (
            <Text style={styles.emptyText}>Không có yêu cầu ở bộ lọc này.</Text>
          ) : null}
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

  countRow: { flexDirection: "row", gap: 10 },
  countBadge: {
    flex: 1,
    backgroundColor: "#f0f4ff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  countNumber: { fontSize: 20, fontWeight: "800", color: colors.text },
  countLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  // Dropdown filter
  dropdownContainer: { zIndex: 10 },
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
  dropdownButtonPressed: { backgroundColor: "#f8fafc" },
  dropdownButtonText: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
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
  dropdownClearText: { fontSize: 12, fontWeight: "700", color: colors.danger },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 10
  },
  dropdownItemChecked: { backgroundColor: "#eff6ff" },
  dropdownItemText: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  dropdownItemTextChecked: { color: colors.primary, fontWeight: "700" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center"
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },

  requestRow: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 10
  },
  requestRowSelected: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  requestBody: { gap: 6 },
  requestRowHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  requestDesc: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0f172a", lineHeight: 19 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  metaText: { fontSize: 11, color: "#64748b" },
  requestActions: { gap: 8 },
  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center", paddingVertical: 8 }
});






