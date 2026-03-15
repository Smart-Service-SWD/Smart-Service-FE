import { useEffect, useState } from "react";
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
  formatShortId
} from "../../../shared/utils/format";
import type {
  AssignmentItem,
  ServiceAgentItem,
  ServiceDefinition,
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";
import {
  completeInProgressRequest,
  createActivityLog,
  setServiceAgentActiveStatus,
  startAssignedRequest
} from "../api/agentApi";

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

export default function AssignmentsScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<AssignmentItem[]>([]);
  const [detailRequestId, setDetailRequestId] = useState("");
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [linkedServiceAgent, setLinkedServiceAgent] = useState<ServiceAgentItem | null>(null);
  const [serviceNamesById, setServiceNamesById] = useState<Record<string, string>>({});
  const [bindingMessage, setBindingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    setBindingMessage("");
    try {
      const [serviceAgentData, serviceDefinitionData] = await Promise.all([
        graphqlRequest<ServiceAgentsResponse>(
          SERVICE_AGENTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<ServiceDefinitionsResponse>(SERVICE_DEFINITIONS_QUERY)
      ]);
      const linkedAgent =
        serviceAgentData.getServiceAgents.find((agent) => agent.userId === session.userId) ?? null;

      setServiceNamesById(
        Object.fromEntries(
          serviceDefinitionData.getServiceDefinitions.map((service) => [service.id, service.name])
        )
      );
      setLinkedServiceAgent(linkedAgent);

      if (!linkedAgent) {
        setItems([]);
        setBindingMessage(
          "Tài khoản này chưa được gắn với hồ sơ thợ kỹ thuật, nên chưa thể tải danh sách công việc."
        );
        return;
      }

      const data = await graphqlRequest<AssignmentResponse, { agentId: string }>(
        AGENT_ASSIGNMENTS_QUERY,
        { agentId: linkedAgent.id },
        session.accessToken
      );
      setItems(data.getAssignmentsByAgentId);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async (requestedId?: string) => {
    if (!session) return;
    const requestId = requestedId ?? detailRequestId;
    if (!requestId.trim()) {
      setError("Hãy chọn một công việc từ danh sách phía trên");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<RequestByIdResponse, { id: string }>(
        REQUEST_BY_ID_QUERY,
        { id: requestId.trim() },
        session.accessToken
      );
      let nextCustomerProfile: UserProfile | null = null;
      if (data.getServiceRequestById?.customerId) {
        const userData = await graphqlRequest<UserByIdResponse, { id: string }>(
          USER_BY_ID_QUERY,
          { id: data.getServiceRequestById.customerId },
          session.accessToken
        );
        nextCustomerProfile = userData.getUserById;
      }
      setDetailRequestId(requestId.trim());
      setDetail(data.getServiceRequestById);
      setCustomerProfile(nextCustomerProfile);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus: "IN_PROGRESS" | "COMPLETED") => {
    if (!session || !detail) {
      setError("Hãy chọn công việc cần cập nhật.");
      return;
    }
    if (targetStatus === "IN_PROGRESS" && detail.status !== "ASSIGNED") {
      setError("Chỉ có thể bắt đầu khi công việc đang ở trạng thái Đã phân công.");
      return;
    }
    if (targetStatus === "COMPLETED" && detail.status !== "IN_PROGRESS") {
      setError("Chỉ có thể hoàn thành khi công việc đang ở trạng thái Đang thực hiện.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const successMessage =
        targetStatus === "IN_PROGRESS"
          ? "Đã chuyển công việc sang trạng thái Đang thực hiện."
          : "Đã hoàn thành công việc.";

      if (targetStatus === "IN_PROGRESS") {
        await startAssignedRequest(session.accessToken, detail.id);
        await createActivityLog(session.accessToken, {
          serviceRequestId: detail.id,
          action: `Agent ${linkedServiceAgent?.id ?? session.userId} started work`
        });
      } else {
        await completeInProgressRequest(session.accessToken, detail.id);
        await createActivityLog(session.accessToken, {
          serviceRequestId: detail.id,
          action: `Agent ${linkedServiceAgent?.id ?? session.userId} completed work`
        });
      }

      await load();
      await loadRequestDetail(detail.id);
      setSuccess(successMessage);
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!session || !linkedServiceAgent) {
      setError("Tài khoản này chưa có hồ sơ thợ để cập nhật trạng thái hoạt động.");
      return;
    }
    setUpdatingAvailability(true);
    setError("");
    setSuccess("");
    try {
      const nextIsActive = !linkedServiceAgent.isActive;
      const result = await setServiceAgentActiveStatus(
        session.accessToken,
        linkedServiceAgent.id,
        nextIsActive
      );
      setLinkedServiceAgent((current) =>
        current ? { ...current, isActive: result.isActive } : current
      );
      setSuccess(
        result.isActive
          ? "Bạn đã bật nhận việc mới. Staff sẽ thấy bạn trong danh sách phân công."
          : "Bạn đã tắt nhận việc mới. Staff sẽ không còn thấy bạn trong danh sách phân công mới."
      );
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setUpdatingAvailability(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    if (!items.length) {
      setDetailRequestId("");
      setDetail(null);
      setCustomerProfile(null);
      return;
    }
    const stillExists = items.some((item) => item.serviceRequestId === detailRequestId);
    if (!stillExists) {
      void loadRequestDetail(items[0].serviceRequestId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const isActive = linkedServiceAgent?.isActive;

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
              <Text style={styles.headerTitle}>Công việc của tôi</Text>
              <Text style={styles.headerSub}>Danh sách công việc được phân công</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
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
        {!!bindingMessage && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>ℹ️ {bindingMessage}</Text>
          </View>
        )}

        {/* Agent status card */}
        <View style={styles.agentCard}>
          <View style={styles.agentCardLeft}>
            <View style={[styles.agentAvatar, isActive ? styles.agentAvatarActive : styles.agentAvatarInactive]}>
              <Text style={styles.agentAvatarText}>{linkedServiceAgent?.fullName?.[0]?.toUpperCase() ?? "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.agentName}>{linkedServiceAgent?.fullName ?? "Chưa gắn hồ sơ"}</Text>
              <View style={[styles.availPill, isActive ? styles.availPillOn : styles.availPillOff]}>
                <Text style={[styles.availPillText, isActive ? styles.availPillTextOn : styles.availPillTextOff]}>
                  {!linkedServiceAgent ? "Chưa có hồ sơ thợ" : isActive ? "🟢 Đang nhận việc" : "⏸ Tạm ngưng"}
                </Text>
              </View>
            </View>
          </View>
          {linkedServiceAgent ? (
            <Pressable
              style={({ pressed }) => [
                styles.toggleBtn,
                isActive ? styles.toggleBtnOff : styles.toggleBtnOn,
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => void handleToggleAvailability()}
              disabled={loading || updatingAvailability}
            >
              {updatingAvailability ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.toggleBtnText}>{isActive ? "Tắt" : "Bật"}</Text>
              )}
            </Pressable>
          ) : null}
        </View>

        {/* Assignment list */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Danh sách công việc ({items.length})</Text>
            {loading && <ActivityIndicator color={colors.primary} size="small" />}
          </View>

          {items.length === 0 && !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Chưa có công việc nào được phân công</Text>
            </View>
          ) : (
            <View style={styles.assignmentList}>
              {items.map((item) => {
                const isSelected = detailRequestId === item.serviceRequestId;
                return (
                  <Pressable
                    key={item.id}
                    style={[styles.assignmentRow, isSelected && styles.assignmentRowSelected]}
                    onPress={() => void loadRequestDetail(item.serviceRequestId)}
                  >
                    <View style={styles.assignmentRowLeft}>
                      <View style={[styles.assignmentDot, isSelected && styles.assignmentDotActive]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.assignmentTitle}>
                          Công việc {formatShortId(item.serviceRequestId)}
                        </Text>
                        <Text style={styles.assignmentMeta}>
                          📅 {formatDateTime(item.assignedAt)}
                        </Text>
                        <Text style={styles.assignmentMeta}>
                          💰 {formatCurrency(item.estimatedCost.amount, item.estimatedCost.currency)}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={styles.selectedTag}>
                        <Text style={styles.selectedTagText}>Đang xem</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Detail panel */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết công việc</Text>

          {detail ? (
            <View style={styles.detailBody}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Trạng thái:</Text>
                <Text style={styles.statusValue}>{formatRequestStatus(detail.status)}</Text>
              </View>

              {[
                { icon: "👤", label: customerProfile?.fullName ?? formatShortId(detail.customerId) },
                { icon: "📞", label: customerProfile?.phoneNumber || "-" },
                {
                  icon: "🛠",
                  label: detail.serviceDefinitionId
                    ? (serviceNamesById[detail.serviceDefinitionId] ?? formatShortId(detail.serviceDefinitionId))
                    : "-"
                },
                { icon: "📝", label: detail.description },
                { icon: "⚡", label: `Độ phức tạp: ${detail.complexity?.level ?? "Chưa đánh giá"}` },
                { icon: "📍", label: detail.addressText || "Khách hàng chưa nhập địa chỉ" }
              ].map(({ icon, label }, i) => (
                <View key={i} style={styles.detailRow}>
                  <Text style={styles.detailIcon}>{icon}</Text>
                  <Text style={styles.detailText}>{label}</Text>
                </View>
              ))}

              {/* Action buttons */}
              <View style={styles.actionRow}>
                {detail.status === "ASSIGNED" ? (
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, styles.actionBtnStart, pressed && { opacity: 0.85 }]}
                    onPress={() => void handleStatusChange("IN_PROGRESS")}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>▶ Bắt đầu làm việc</Text>}
                  </Pressable>
                ) : null}
                {detail.status === "IN_PROGRESS" ? (
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, styles.actionBtnDone, pressed && { opacity: 0.85 }]}
                    onPress={() => void handleStatusChange("COMPLETED")}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionBtnText}>✅ Hoàn thành công việc</Text>}
                  </Pressable>
                ) : null}
                {detail.status === "COMPLETED" ? (
                  <View style={styles.completedBadge}>
                    <Text style={styles.completedText}>✅ Công việc đã hoàn thành</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Nhấn vào một công việc ở trên để xem chi tiết</Text>
          )}

          <ActionButton
            label={loading ? "Đang tải..." : "Tải lại yêu cầu đang chọn"}
            onPress={() => void loadRequestDetail(detailRequestId)}
            disabled={loading || !detailRequestId}
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
  successBox: { backgroundColor: "#eff6ff", borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 12, padding: 12 },
  successText: { fontSize: 13, color: "#1d4ed8", fontWeight: "600" },
  infoBox: { backgroundColor: "#f0f4ff", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 12 },
  infoText: { fontSize: 13, color: "#64748b" },

  // Agent card
  agentCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  agentCardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  agentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  agentAvatarActive: { backgroundColor: "#dbeafe" },
  agentAvatarInactive: { backgroundColor: "#f1f5f9" },
  agentAvatarText: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  agentName: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  availPill: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  availPillOn: { backgroundColor: "#dbeafe" },
  availPillOff: { backgroundColor: "#f1f5f9" },
  availPillText: { fontSize: 11, fontWeight: "700" },
  availPillTextOn: { color: "#2563eb" },
  availPillTextOff: { color: "#64748b" },
  toggleBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  toggleBtnOn: { backgroundColor: "#2563eb" },
  toggleBtnOff: { backgroundColor: "#dc2626" },
  toggleBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

  // Card
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
  emptyEmoji: { fontSize: 32 },
  emptyText: { color: "#94a3b8", fontSize: 13, textAlign: "center" },

  assignmentList: { gap: 8 },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12
  },
  assignmentRowSelected: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  assignmentRowLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  assignmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#cbd5e1",
    flexShrink: 0
  },
  assignmentDotActive: { backgroundColor: colors.primary },
  assignmentTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  assignmentMeta: { fontSize: 11, color: "#64748b" },
  selectedTag: { backgroundColor: "#eff6ff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  selectedTagText: { fontSize: 10, fontWeight: "800", color: colors.primary },

  // Detail
  detailBody: { gap: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusLabel: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  statusValue: { fontSize: 13, fontWeight: "800", color: colors.primary },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  detailIcon: { fontSize: 14, marginTop: 1 },
  detailText: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },
  actionRow: { gap: 10, marginTop: 6 },
  actionBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3
  },
  actionBtnStart: { backgroundColor: colors.primary },
  actionBtnDone: { backgroundColor: "#2563eb" },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  completedBadge: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe"
  },
  completedText: { color: "#1d4ed8", fontWeight: "800", fontSize: 14 }
});
