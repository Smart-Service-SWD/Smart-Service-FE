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

interface AgentWorkItem {
  assignment: AssignmentItem;
  request: ServiceRequestItem;
  serviceName: string;
}

const ACTIVE_STATUSES = new Set(["ASSIGNED", "IN_PROGRESS"]);

export default function AssignmentsScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<AgentWorkItem[]>([]);
  const [detailRequestId, setDetailRequestId] = useState("");
  const [detail, setDetail] = useState<ServiceRequestItem | null>(null);
  const [customerProfile, setCustomerProfile] = useState<UserProfile | null>(null);
  const [linkedServiceAgent, setLinkedServiceAgent] = useState<ServiceAgentItem | null>(null);
  const [bindingMessage, setBindingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedWork = useMemo(
    () => items.find((item) => item.request.id === detailRequestId) ?? null,
    [items, detailRequestId]
  );

  const loadCustomerProfile = async (customerId: string) => {
    if (!session) return null;

    const userData = await graphqlRequest<UserByIdResponse, { id: string }>(
      USER_BY_ID_QUERY,
      { id: customerId },
      session.accessToken
    );

    return userData.getUserById;
  };

  const load = async () => {
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
        setDetail(null);
        setCustomerProfile(null);
        setDetailRequestId("");
        setBindingMessage(
          "Tài khoản này chưa được gắn với hồ sơ thợ kỹ thuật, nên chưa thể tải danh sách phân công."
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

      const workItems = (
        await Promise.all(
          data.getAssignmentsByAgentId.map(async (assignment) => {
            try {
              const response = await graphqlRequest<RequestByIdResponse, { id: string }>(
                REQUEST_BY_ID_QUERY,
                { id: assignment.serviceRequestId },
                session.accessToken
              );

              const request = response.getServiceRequestById
                ? normalizeServiceRequest(response.getServiceRequestById)
                : null;

              if (!request || !ACTIVE_STATUSES.has(request.status)) {
                return null;
              }

              return {
                assignment,
                request,
                serviceName: request.serviceDefinitionId
                  ? definitionNameById[request.serviceDefinitionId] ?? "Dịch vụ"
                  : "Dịch vụ"
              } satisfies AgentWorkItem;
            } catch {
              return null;
            }
          })
        )
      )
        .filter((item): item is AgentWorkItem => item !== null)
        .sort((a, b) => {
          if (a.request.status !== b.request.status) {
            return a.request.status === "IN_PROGRESS" ? -1 : 1;
          }
          return new Date(b.assignment.assignedAt).getTime() - new Date(a.assignment.assignedAt).getTime();
        });

      setItems(workItems);
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
      setError("Hãy chọn một đơn ở danh sách phía trên.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const currentWork = items.find((item) => item.request.id === requestId.trim()) ?? null;
      const request = currentWork?.request
        ? currentWork.request
        : normalizeServiceRequest(
            (
              await graphqlRequest<RequestByIdResponse, { id: string }>(
                REQUEST_BY_ID_QUERY,
                { id: requestId.trim() },
                session.accessToken
              )
            ).getServiceRequestById as ServiceRequestItem
          );

      const nextCustomerProfile = request.customerId
        ? await loadCustomerProfile(request.customerId)
        : null;

      setDetailRequestId(requestId.trim());
      setDetail(request);
      setCustomerProfile(nextCustomerProfile);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus: "IN_PROGRESS" | "COMPLETED") => {
    if (!session || !detail) {
      setError("Hãy chọn đơn cần cập nhật.");
      return;
    }

    if (targetStatus === "IN_PROGRESS" && detail.status !== "ASSIGNED") {
      setError("Chỉ có thể bắt đầu khi đơn đang ở trạng thái Đã phân công.");
      return;
    }

    if (targetStatus === "COMPLETED" && detail.status !== "IN_PROGRESS") {
      setError("Chỉ có thể hoàn thành khi đơn đang ở trạng thái Đang thực hiện.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
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

      if (targetStatus === "IN_PROGRESS") {
        await loadRequestDetail(detail.id);
        setSuccess("Đã chuyển đơn sang trạng thái Đang thực hiện.");
      } else {
        setDetail(null);
        setCustomerProfile(null);
        setDetailRequestId("");
        setSuccess("Đã hoàn thành công việc. Đơn này sẽ được chuyển sang mục Lịch sử.");
      }
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

    const stillExists = items.some((item) => item.request.id === detailRequestId);
    if (!detailRequestId || !stillExists) {
      void loadRequestDetail(items[0].request.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const isActive = linkedServiceAgent?.isActive ?? false;

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
              <Text style={styles.headerTitle}>Phân công của tôi</Text>
              <Text style={styles.headerSub}>Chỉ hiển thị đơn mới giao và đang thực hiện</Text>
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
        {!!success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>
              <MaterialIcons name="check-circle" size={14} color="#1d4ed8" /> {success}
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

        <View style={styles.agentCard}>
          <View style={styles.agentCardLeft}>
            <View style={[styles.agentAvatar, isActive ? styles.agentAvatarActive : styles.agentAvatarInactive]}>
              <Text style={styles.agentAvatarText}>{linkedServiceAgent?.fullName?.[0]?.toUpperCase() ?? "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.agentName}>{linkedServiceAgent?.fullName ?? "Chưa gắn hồ sơ"}</Text>
              <View style={[styles.availPill, isActive ? styles.availPillOn : styles.availPillOff]}>
                <View style={styles.availPillContent}>
                  <MaterialIcons
                    name={isActive ? "fiber-manual-record" : "pause-circle-outline"}
                    size={isActive ? 8 : 14}
                    color={isActive ? "#16a34a" : "#94a3b8"}
                  />
                  <Text style={[styles.availPillText, isActive ? styles.availPillTextOn : styles.availPillTextOff]}>
                    {!linkedServiceAgent ? "Chưa có hồ sơ thợ" : isActive ? "Đang nhận việc" : "Tạm ngưng"}
                  </Text>
                </View>
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

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Danh sách phân công ({items.length})</Text>
            {loading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
          </View>

          {items.length === 0 && !loading ? (
            <View style={styles.emptyWrap}>
              <MaterialIcons name="assignment-late" size={36} color="#94a3b8" />
              <Text style={styles.emptyText}>Không có đơn mới giao hoặc đang thực hiện</Text>
            </View>
          ) : (
            <View style={styles.assignmentList}>
              {items.map((item) => {
                const isSelected = detailRequestId === item.request.id;
                return (
                  <Pressable
                    key={item.assignment.id}
                    style={[styles.assignmentRow, isSelected && styles.assignmentRowSelected]}
                    onPress={() => void loadRequestDetail(item.request.id)}
                  >
                    <View style={styles.assignmentRowLeft}>
                      <View
                        style={[
                          styles.assignmentDot,
                          item.request.status === "IN_PROGRESS" && styles.assignmentDotInProgress,
                          isSelected && styles.assignmentDotActive
                        ]}
                      />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={styles.assignmentTitle}>{item.serviceName}</Text>
                        <Text style={styles.assignmentMeta}>
                          <MaterialIcons name="event" size={13} color="#64748b" /> {formatDateTime(item.assignment.assignedAt)}
                        </Text>
                        <Text style={styles.assignmentMeta}>
                          <MaterialIcons name="attach-money" size={13} color="#64748b" /> {formatCurrency(item.assignment.estimatedCost.amount, item.assignment.estimatedCost.currency)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusPill, item.request.status === "IN_PROGRESS" ? styles.statusPillProgress : styles.statusPillAssigned]}>
                      <Text style={[styles.statusPillText, item.request.status === "IN_PROGRESS" ? styles.statusPillTextProgress : styles.statusPillTextAssigned]}>
                        {formatRequestStatus(item.request.status)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Chi tiết công việc</Text>

          {detail ? (
            <View style={styles.detailBody}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Trạng thái:</Text>
                <Text style={styles.statusValue}>{formatRequestStatus(detail.status)}</Text>
              </View>

              {[
                { icon: "person-outline" as const, label: customerProfile?.fullName ?? formatShortId(detail.customerId) },
                { icon: "phone" as const, label: customerProfile?.phoneNumber || "-" },
                { icon: "build" as const, label: selectedWork?.serviceName ?? "Dịch vụ" },
                { icon: "description" as const, label: detail.description },
                { icon: "flash-on" as const, label: `Độ phức tạp: ${detail.complexity?.level ?? "Chưa đánh giá"}` },
                {
                  icon: "attach-money" as const,
                  label: detail.estimatedCost
                    ? formatCurrency(detail.estimatedCost.amount, detail.estimatedCost.currency)
                    : selectedWork
                      ? formatCurrency(selectedWork.assignment.estimatedCost.amount, selectedWork.assignment.estimatedCost.currency)
                      : "-"
                },
                { icon: "place" as const, label: detail.addressText || "Khách hàng chưa nhập địa chỉ" }
              ].map(({ icon, label }, index) => (
                <View key={index} style={styles.detailRow}>
                  <MaterialIcons name={icon} size={16} color="#64748b" />
                  <Text style={styles.detailText}>{label}</Text>
                </View>
              ))}

              <View style={styles.actionRow}>
                {detail.status === "ASSIGNED" ? (
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, styles.actionBtnStart, pressed && { opacity: 0.85 }]}
                    onPress={() => void handleStatusChange("IN_PROGRESS")}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>
                        <MaterialIcons name="play-arrow" size={16} color="#fff" /> Bắt đầu làm việc
                      </Text>
                    )}
                  </Pressable>
                ) : null}

                {detail.status === "IN_PROGRESS" ? (
                  <Pressable
                    style={({ pressed }) => [styles.actionBtn, styles.actionBtnDone, pressed && { opacity: 0.85 }]}
                    onPress={() => void handleStatusChange("COMPLETED")}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>
                        <MaterialIcons name="check-circle" size={16} color="#fff" /> Hoàn thành công việc
                      </Text>
                    )}
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Nhấn vào một đơn ở trên để xem chi tiết</Text>
          )}

          <ActionButton
            label={loading ? "Đang tải..." : "Tải lại chi tiết"}
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
  availPill: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  availPillOn: { backgroundColor: "#dbeafe" },
  availPillOff: { backgroundColor: "#f1f5f9" },
  availPillContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  availPillText: { fontSize: 11, fontWeight: "700" },
  availPillTextOn: { color: "#2563eb" },
  availPillTextOff: { color: "#64748b" },
  toggleBtn: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  toggleBtnOn: { backgroundColor: "#2563eb" },
  toggleBtnOff: { backgroundColor: "#dc2626" },
  toggleBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },

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

  assignmentList: { gap: 8 },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 10
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
  assignmentDotInProgress: { backgroundColor: "#f59e0b" },
  assignmentTitle: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  assignmentMeta: { fontSize: 11, color: "#64748b" },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  statusPillAssigned: { backgroundColor: "#eff6ff" },
  statusPillProgress: { backgroundColor: "#fef3c7" },
  statusPillText: { fontSize: 10, fontWeight: "800" },
  statusPillTextAssigned: { color: "#2563eb" },
  statusPillTextProgress: { color: "#b45309" },

  detailBody: { gap: 10 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusLabel: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  statusValue: { fontSize: 13, fontWeight: "800", color: colors.primary },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
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
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" }
});
