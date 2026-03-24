import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  AGENT_ASSIGNMENTS_QUERY,
  REQUEST_BY_ID_QUERY,
  SERVICE_AGENTS_QUERY,
  SERVICE_DEFINITIONS_QUERY,
  USER_BY_ID_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime,
  formatRequestStatus,
  formatShortId,
  normalizeServiceRequest
} from "../../../shared/utils/format";
import type {
  AssignmentItem,
  ServiceAgentItem,
  ServiceDefinition,
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface AssignmentResponse {
  getAssignmentsByAgentId: AssignmentItem[];
}

interface RequestByIdResponse {
  getServiceRequestById: ServiceRequestItem | null;
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

interface ServiceDefinitionsResponse {
  getServiceDefinitions: ServiceDefinition[];
}

interface UserByIdResponse {
  getUserById: UserProfile | null;
}

interface CompletedWorkItem {
  assignment: AssignmentItem;
  request: ServiceRequestItem;
  serviceName: string;
}

export default function AgentRequestBoardScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<CompletedWorkItem[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [linkedServiceAgent, setLinkedServiceAgent] = useState<ServiceAgentItem | null>(null);
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [bindingMessage, setBindingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.request.id === selectedRequestId) ?? null,
    [items, selectedRequestId]
  );

  const loadHistory = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    setBindingMessage("");

    try {
      const [serviceAgentData, serviceDefinitionData] = await Promise.all([
        graphqlRequest<ServiceAgentsResponse>(SERVICE_AGENTS_QUERY, undefined, session.accessToken),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY)
      ]);

      const linkedAgent =
        serviceAgentData.getServiceAgents.find((agent) => agent.userId === session.userId) ?? null;

      setLinkedServiceAgent(linkedAgent);

      if (!linkedAgent) {
        setItems([]);
        setSelectedRequestId("");
        setCustomerProfile(null);
        setBindingMessage(
          "Tài khoản này chưa được gắn với hồ sơ thợ kỹ thuật, nên chưa thể tải lịch sử hoàn thành."
        );
        return;
      }

      const definitionNameById = Object.fromEntries(
        serviceDefinitionData.getServiceDefinitions.map((service) => [service.id, service.name])
      );

      const data = await graphqlRequest<AssignmentResponse, { agentId: string }>(
        AGENT_ASSIGNMENTS_QUERY,
        { agentId: linkedAgent.id },
        session.accessToken
      );

      // Deduplicate by serviceRequestId (keep latest assignedAt)
      const latestAssignments = new Map<string, AssignmentItem>();
      data.getAssignmentsByAgentId.forEach(assignment => {
        const existing = latestAssignments.get(assignment.serviceRequestId);
        if (!existing || new Date(assignment.assignedAt).getTime() > new Date(existing.assignedAt).getTime()) {
          latestAssignments.set(assignment.serviceRequestId, assignment);
        }
      });
      const uniqueAssignments = Array.from(latestAssignments.values());

      const completedItems = (
        await Promise.all(
          uniqueAssignments.map(async (assignment) => {
            try {
              const response = await graphqlRequest<RequestByIdResponse, { id: string }>(
                REQUEST_BY_ID_QUERY,
                { id: assignment.serviceRequestId },
                session.accessToken
              );

              const request = response.getServiceRequestById
                ? normalizeServiceRequest(response.getServiceRequestById)
                : null;

              if (!request || (request.status !== "FINAL_PAYMENT_PAID" && request.status !== "PAYOUT_COMPLETED")) {
                return null;
              }

              return {
                assignment,
                request,
                serviceName: request.serviceDefinitionId
                  ? definitionNameById[request.serviceDefinitionId] ?? "Dịch vụ"
                  : "Dịch vụ"
              } satisfies CompletedWorkItem;
            } catch {
              return null;
            }
          })
        )
      )
        .filter((item): item is CompletedWorkItem => item !== null)
        .sort((a, b) => new Date(b.assignment.assignedAt).getTime() - new Date(a.assignment.assignedAt).getTime());

      setItems(completedItems);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session]);

  const loadCustomerProfile = async (customerId?: string) => {
    if (!session || !customerId) {
      setCustomerProfile(null);
      return;
    }

    try {
      const userData = await graphqlRequest<UserByIdResponse, { id: string }>(
        USER_BY_ID_QUERY,
        { id: customerId },
        session.accessToken
      );
      setCustomerProfile(userData.getUserById);
    } catch {
      setCustomerProfile(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory])
  );

  useEffect(() => {
    if (!items.length) {
      setSelectedRequestId("");
      setCustomerProfile(null);
      return;
    }

    if (!selectedRequestId || !items.some((item) => item.request.id === selectedRequestId)) {
      setSelectedRequestId(items[0].request.id);
    }
  }, [items, selectedRequestId]);

  useEffect(() => {
    void loadCustomerProfile(selectedItem?.request.customerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.request.customerId, session?.accessToken]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Lịch sử công việc</Text>
              <Text style={styles.headerSub}>Các đơn bạn đã hoàn thành</Text>
            </View>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>
              <MaterialIcons name="warning-amber" size={14} color={colors.danger} /> {error}
            </Text>
          </View>
        )}
        {!!bindingMessage && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              <MaterialIcons name="info-outline" size={14} color="#1d4ed8" /> {bindingMessage}
            </Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryMetric}>
            <Text style={styles.summaryNumber}>{items.length}</Text>
            <Text style={styles.summaryLabel}>Đơn hoàn thành</Text>
          </View>
          <View style={styles.summaryMetaWrap}>
            <Text style={styles.summaryMeta}>Thợ: {linkedServiceAgent?.fullName ?? "Chưa gắn hồ sơ"}</Text>
            <Text style={styles.summaryMeta}>Màn này chỉ lưu lịch sử các đơn đã xong.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Lịch sử hoàn thành ({items.length})</Text>
            {loading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
          </View>

          {items.length === 0 && !loading ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="history" size={36} color="#94a3b8" />
              <Text style={styles.emptyText}>Chưa có đơn hoàn thành nào để hiển thị</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {items.map((item) => {
                const isSelected = selectedRequestId === item.request.id;
                return (
                  <Pressable
                    key={item.assignment.id}
                    style={[styles.historyRow, isSelected && styles.historyRowSelected]}
                    onPress={() => setSelectedRequestId(item.request.id)}
                  >
                    <View style={styles.historyRowLeft}>
                      <View style={styles.completedDot} />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={styles.historyTitle}>{item.serviceName}</Text>
                        <Text style={styles.historyMeta}>
                          <MaterialIcons name="event" size={13} color="#64748b" /> {formatDateTime(item.assignment.assignedAt)}
                        </Text>
                        <Text style={styles.historyMeta} numberOfLines={1}>{item.request.description}</Text>
                      </View>
                    </View>
                    <View style={styles.donePill}>
                      <Text style={styles.donePillText}>Hoàn thành</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết lịch sử</Text>

          {selectedItem ? (
            <View style={styles.detailBody}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Trạng thái:</Text>
                <Text style={styles.statusValue}>{formatRequestStatus(selectedItem.request.status)}</Text>
              </View>

              {[
                { icon: "person-outline" as const, label: customerProfile?.fullName ?? formatShortId(selectedItem.request.customerId) },
                { icon: "phone" as const, label: customerProfile?.phoneNumber || "-" },
                { icon: "build" as const, label: selectedItem.serviceName },
                { icon: "description" as const, label: selectedItem.request.description },
                { icon: "schedule" as const, label: `Phân công lúc: ${formatDateTime(selectedItem.assignment.assignedAt)}` },
                { icon: "flash-on" as const, label: `Độ phức tạp: ${selectedItem.request.complexity?.level ?? "Chưa đánh giá"}` },
                {
                  icon: "attach-money" as const,
                  label: selectedItem.request.estimatedCost
                    ? formatCurrency(selectedItem.request.estimatedCost.amount, selectedItem.request.estimatedCost.currency)
                    : formatCurrency(selectedItem.assignment.estimatedCost.amount, selectedItem.assignment.estimatedCost.currency)
                },
                { icon: "place" as const, label: selectedItem.request.addressText || "Khách hàng chưa nhập địa chỉ" }
              ].map(({ icon, label }, index) => (
                <View key={index} style={styles.detailRow}>
                  <MaterialIcons name={icon} size={16} color="#64748b" />
                  <Text style={styles.detailText}>{label}</Text>
                </View>
              ))}

              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>
                  <MaterialIcons name="check-circle" size={14} color="#16a34a" /> Đơn này đã hoàn thành
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Chọn một đơn hoàn thành để xem chi tiết</Text>
          )}

          <ActionButton
            label={loading ? "Đang tải..." : "Tải lại lịch sử"}
            onPress={() => void loadHistory()}
            disabled={loading}
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
  content: { paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20, gap: 14 },

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
    marginBottom: 8
  },
  headerLeft: { flexDirection: "row", gap: 12, flex: 1, alignItems: "flex-start" },
  logoBox: { width: 50, height: 50, borderRadius: 14, overflow: "hidden", flexShrink: 0 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b", marginTop: 2 },

  errorBox: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, padding: 12 },
  errorText: { fontSize: 13, color: colors.danger },
  infoBox: { backgroundColor: "#f0f4ff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 12 },
  infoText: { fontSize: 13, color: "#64748b" },

  summaryCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  summaryMetric: {
    width: 92,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe"
  },
  summaryNumber: { fontSize: 28, fontWeight: "800", color: colors.primary },
  summaryLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },
  summaryMetaWrap: { flex: 1, gap: 4 },
  summaryMeta: { fontSize: 12, color: "#64748b" },

  card: {
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
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },

  emptyWrap: { alignItems: "center", paddingVertical: 24, gap: 8 },
  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center" },
  listWrap: { gap: 8 },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12
  },
  historyRowSelected: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  historyRowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  completedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#16a34a" },
  historyTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  historyMeta: { fontSize: 11, color: "#64748b" },
  donePill: { backgroundColor: "#ecfdf3", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  donePillText: { fontSize: 10, fontWeight: "800", color: "#15803d" },

  detailBody: { gap: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusLabel: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  statusValue: { fontSize: 13, fontWeight: "800", color: colors.primary },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detailText: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },
  completedBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginTop: 6
  },
  completedText: { color: "#1d4ed8", fontWeight: "800", fontSize: 14 }
});
