import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import type { StaffTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY,
  SERVICE_AGENTS_QUERY,
  SERVICE_DEFINITIONS_QUERY,
  USERS_QUERY
} from "../../../shared/api/graphqlDocuments";
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

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

interface UsersResponse {
  getUsers: UserProfile[];
}

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_REVIEW: { bg: "#fefce8", text: "#ca8a04" },
  COMPLETED: { bg: "#f0fdf4", text: "#16a34a" },
  ASSIGNED: { bg: "#eff6ff", text: "#2563eb" }
};

const getStatusStyle = (status?: string | null) =>
  STATUS_COLORS[status ?? ""] ?? { bg: "#f0f4ff", text: "#64748b" };

const getEstimatedCostLabel = (request: ServiceRequestItem | null) => {
  if (!request?.estimatedCost) return "Chưa có chi phí ước tính";
  return formatCurrency(request.estimatedCost.amount, request.estimatedCost.currency);
};

export default function DispatchHistoryScreen() {
  const { session } = useAuth();
  const navigation = useNavigation<BottomTabNavigationProp<StaffTabParamList>>();
  const route = useRoute<RouteProp<StaffTabParamList, "DispatchHistory">>();
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [agents, setAgents] = useState<ServiceAgentItem[]>([]);
  const [customerNamesById, setCustomerNamesById] = useState<Record<string, string>>({});
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [selectedRequestId, setSelectedRequestId] = useState(route.params?.requestId ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const orderedRequests = useMemo(
    () =>
      [...requests].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      ),
    [requests]
  );

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId) ?? null,
    [requests, selectedRequestId]
  );

  const selectedServiceName = useMemo(() => {
    if (!selectedRequest?.serviceDefinitionId) return "-";
    return (
      serviceNamesById[selectedRequest.serviceDefinitionId] ??
      formatShortId(selectedRequest.serviceDefinitionId)
    );
  }, [selectedRequest?.serviceDefinitionId, serviceNamesById]);

  const getCustomerName = (customerId?: string | null) =>
    customerId ? customerNamesById[customerId] ?? formatShortId(customerId) : "-";

  const getAgentName = (agentId?: string | null) =>
    agentId
      ? agents.find((agent) => agent.id === agentId)?.fullName ?? formatShortId(agentId)
      : "Chưa gán";

  const loadInitialData = async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [requestData, agentData, userData, serviceData] = await Promise.all([
        graphqlRequest<AllRequestsResponse>(ALL_REQUESTS_QUERY, undefined, session.accessToken),
        graphqlRequest<ServiceAgentsResponse>(SERVICE_AGENTS_QUERY, undefined, session.accessToken),
        graphqlRequest<UsersResponse>(USERS_QUERY, undefined, session.accessToken),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY)
      ]);

      const assignedRequests = normalizeServiceRequests(requestData.getServiceRequests).filter((request) => !!request.assignedProviderId);

      setRequests(assignedRequests);
      setAgents(agentData.getServiceAgents);

      setCustomerNamesById(Object.fromEntries(userData.getUsers.map((user) => [user.id, user.fullName])));

      setServiceNamesById(
        Object.fromEntries(serviceData.getServiceDefinitions.map((service) => [service.id, service.name]))
      );

      setSelectedRequestId((current) => {
        const routeRequestId = route.params?.requestId;
        if (current && assignedRequests.some((item) => item.id === current)) return current;
        if (routeRequestId && assignedRequests.some((item) => item.id === routeRequestId)) return routeRequestId;
        return assignedRequests[0]?.id ?? "";
      });
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (!route.params?.requestId) return;
    setSelectedRequestId(route.params.requestId);
    navigation.setParams({ requestId: undefined });
  }, [navigation, route.params?.requestId]);

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
              <Text style={styles.headerTitle}>Lịch sử phân công</Text>
              <Text style={styles.headerSub}>Xem lại các yêu cầu đã gán thợ</Text>
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

        {/* Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan lịch sử</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryBig}>{orderedRequests.length}</Text>
            <Text style={styles.summaryLabel}>yêu cầu đã có provider</Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
              <Text style={[styles.statusText, { color: "#2563eb" }]}>
                {loading ? "Đang đồng bộ" : "Đang chọn"}
              </Text>
            </View>

            <View style={[styles.statusPill, { backgroundColor: "#f0f4ff", flex: 1 }]}>
              <Text style={[styles.statusText, { color: "#64748b" }]} numberOfLines={1}>
                {selectedRequestId ? selectedServiceName : "Chưa chọn"}
              </Text>
            </View>
          </View>

          {/* ✅ 2 button nằm ngang: Làm mới + Bỏ chọn */}
          <View style={styles.summaryActionRow}>
            <View style={styles.summaryActionCol}>
              <ActionButton
                label={loading ? "Đang làm mới..." : "Làm mới"}
                onPress={() => {
                  void loadInitialData();
                }}
                disabled={loading}
                variant="secondary"
              />
            </View>

            <View style={styles.summaryActionCol}>
              <ActionButton
                label="Bỏ chọn"
                onPress={() => setSelectedRequestId("")}
                disabled={loading || !selectedRequestId}
                variant="danger"
              />
            </View>
          </View>
        </View>

        {/* Requests */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Yêu cầu đã gán ({orderedRequests.length})</Text>
          <Text style={styles.hintText}>Chạm vào một card để xem lại lịch sử</Text>

          {orderedRequests.map((request) => {
            const active = request.id === selectedRequestId;
            const statusStyle = getStatusStyle(request.status);
            return (
              <Pressable
                key={request.id}
                style={[styles.requestCard, active && styles.requestCardActive]}
                onPress={() => setSelectedRequestId(request.id)}
              >
                <View style={styles.requestHeader}>
                  <Text style={styles.requestTitle} numberOfLines={2}>
                    {request.description}
                  </Text>
                  <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {formatRequestStatus(request.status)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.metaText}>Khách hàng: {getCustomerName(request.customerId)}</Text>
                <Text style={styles.metaText}>Thợ hiện tại: {getAgentName(request.assignedProviderId)}</Text>
                <Text style={styles.metaText}>Chi phí ước tính: {getEstimatedCostLabel(request)}</Text>

                <View style={[styles.cardFooter, active && styles.cardFooterActive]}>
                  <Text style={[styles.cardFooterText, active && styles.cardFooterTextActive]}>
                    {active
                      ? "Card này đang được chọn để xem lại lịch sử phân công."
                      : "Chạm để mở lại lịch sử của yêu cầu này."}
                  </Text>
                </View>

                <View style={styles.badgeRow}>
                  <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                    <Text style={[styles.statusText, { color: "#2563eb" }]}>
                      {formatDateTime(request.createdAt)}
                    </Text>
                  </View>
                  {active ? (
                    <View style={[styles.statusPill, { backgroundColor: "#f0fdf4" }]}>
                      <Text style={[styles.statusText, { color: "#16a34a" }]}>Đang xem</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          })}

          {!orderedRequests.length ? <Text style={styles.emptyText}>Chưa có yêu cầu nào đã được gán thợ.</Text> : null}
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

  summaryBox: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    gap: 4
  },
  summaryBig: { fontSize: 30, fontWeight: "900", color: colors.text },
  summaryLabel: { fontSize: 13, color: "#64748b" },
  summaryRow: { flexDirection: "row", gap: 8, alignItems: "center" },

  summaryActionRow: { flexDirection: "row", gap: 10 },
  summaryActionCol: { flex: 1 },

  requestCard: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 8,
    overflow: "hidden"
  },
  requestCardActive: {
    borderColor: colors.primary,
    backgroundColor: "#eff6ff"
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8
  },
  requestTitle: { flex: 1, fontSize: 13, fontWeight: "700", color: "#0f172a", lineHeight: 19 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  metaText: { fontSize: 11, color: "#64748b" },
  hintText: { fontSize: 12, color: "#94a3b8" },

  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    marginTop: 4,
    backgroundColor: "transparent"
  },
  cardFooterActive: {
    borderTopColor: colors.primary
  },
  cardFooterText: { color: "#94a3b8", fontSize: 11, lineHeight: 17 },
  cardFooterTextActive: { color: colors.primary, fontWeight: "600" },

  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center", paddingVertical: 8 }
});
