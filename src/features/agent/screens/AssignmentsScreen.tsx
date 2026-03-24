import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Image as RNImage
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
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
  requestCompletion,
  createActivityLog,
  createPriceAdjustmentRequest,
  setServiceAgentActiveStatus,
  startAssignedRequest
} from "../api/agentApi";
import LabeledInput from "../../../shared/ui/LabeledInput";

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
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [newPriceAmount, setNewPriceAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<{ uri: string; name: string; type: string } | null>(null);

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
        setBindingMessage("Tài khoản này chưa được gắn với hồ sơ thợ kỹ thuật, nên chưa thể tải danh sách phân công.");
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
              if (!request || !ACTIVE_STATUSES.has(request.status)) return null;
              return {
                assignment,
                request,
                serviceName: request.serviceDefinitionId
                  ? definitionNameById[request.serviceDefinitionId] ?? "Dịch vụ"
                  : "Dịch vụ"
              };
            } catch { return null; }
          })
        )
      )
        .filter((item): item is AgentWorkItem => item !== null)
        .sort((a, b) => {
          if (a.request.status !== b.request.status) return a.request.status === "IN_PROGRESS" ? -1 : 1;
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
    if (!requestId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const currentWork = items.find((item) => item.request.id === requestId.trim()) ?? null;
      const request = currentWork?.request
        ? currentWork.request
        : normalizeServiceRequest(
            (await graphqlRequest<RequestByIdResponse, { id: string }>(
              REQUEST_BY_ID_QUERY, { id: requestId.trim() }, session.accessToken
            )).getServiceRequestById as ServiceRequestItem
          );
      const nextCustomerProfile = request.customerId ? await loadCustomerProfile(request.customerId) : null;
      setDetailRequestId(requestId.trim());
      setDetail(request);
      setCustomerProfile(nextCustomerProfile);
      
      // Reset modal fields when switching assignments to avoid data leak
      setCompletionNotes("");
      setEvidenceUrl("");
      setSelectedImage(null);
      setNewPriceAmount("");
      setAdjustmentReason("");
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (targetStatus: "IN_PROGRESS" | "REQUEST_COMPLETION") => {
    if (!session || !detail) return;
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
        setSuccess("Đã chuyển đơn sang trạng thái Đang thực hiện.");
      } else {
        // REQUEST_COMPLETION
        await requestCompletion(session.accessToken, detail.id, {
          notes: completionNotes.trim() || undefined,
          image: selectedImage ?? undefined
        });
        await createActivityLog(session.accessToken, {
          serviceRequestId: detail.id,
          action: `Agent ${linkedServiceAgent?.id ?? session.userId} requested completion`
        });
        setShowCompletionModal(false);
        setCompletionNotes("");
        setEvidenceUrl("");
        setSelectedImage(null);
        setDetail(null);
        setCustomerProfile(null);
        setDetailRequestId("");
        setSuccess("Đã gửi yêu cầu hoàn thành. Vui lòng chờ Staff duyệt.");
      }
      await load();
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!session || !linkedServiceAgent) return;
    setUpdatingAvailability(true);
    setError("");
    setSuccess("");
    try {
      const nextIsActive = !linkedServiceAgent.isActive;
      const result = await setServiceAgentActiveStatus(session.accessToken, linkedServiceAgent.id, nextIsActive);
      setLinkedServiceAgent((current) => current ? { ...current, isActive: result.isActive } : current);
      setSuccess(result.isActive ? "Đang nhận việc." : "Tạm ngưng nhận việc.");
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleCreateAdjustment = async () => {
    if (!session || !detail || !linkedServiceAgent) return;
    const amount = Number.parseFloat(newPriceAmount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Số tiền phải là số dương.");
      return;
    }
    if (!adjustmentReason.trim()) {
      setError("Vui lòng nhập lý do.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await createPriceAdjustmentRequest(session.accessToken, {
        serviceRequestId: detail.id,
        newPrice: { amount, currency: detail.estimatedCost?.currency || "VND" },
        reason: adjustmentReason,
        createdBy: linkedServiceAgent.id
      });
      setSuccess("Đã gửi yêu cầu điều chỉnh giá.");
      setShowAdjustmentModal(false);
      setNewPriceAmount("");
      setAdjustmentReason("");
    } catch (err) {
      setError(asErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileName = asset.uri.split("/").pop() || "evidence.jpg";
      setSelectedImage({
        uri: asset.uri,
        name: fileName,
        type: "image/jpeg"
      });
    }
  };

  useEffect(() => { void load(); }, [session?.accessToken]);

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
  }, [items]);

  const isActive = linkedServiceAgent?.isActive ?? false;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoBox}><BrandLogo size={40} /></View>
          <View>
            <Text style={styles.headerTitle}>Phân công của tôi</Text>
            <Text style={styles.headerSub}>Đơn mới giao và đang thực hiện</Text>
          </View>
        </View>

        {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
        {!!success && <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View>}
        {!!bindingMessage && <View style={styles.infoBox}><Text style={styles.infoText}>{bindingMessage}</Text></View>}

        <View style={styles.agentCard}>
          <View style={styles.agentCardLeft}>
            <View style={[styles.agentAvatar, isActive ? styles.agentAvatarActive : styles.agentAvatarInactive]}>
              <Text style={styles.agentAvatarText}>{linkedServiceAgent?.fullName?.[0]?.toUpperCase() ?? "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.agentName}>{linkedServiceAgent?.fullName ?? "Thợ"}</Text>
              <Text style={[styles.availText, { color: isActive ? "#16a34a" : "#94a3b8" }]}>{isActive ? "Đang nhận việc" : "Tạm ngưng"}</Text>
            </View>
          </View>
          <Pressable style={[styles.toggleBtn, isActive ? styles.toggleBtnOff : styles.toggleBtnOn]} onPress={() => void handleToggleAvailability()} disabled={updatingAvailability}>
            {updatingAvailability ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.toggleBtnText}>{isActive ? "Tắt" : "Bật"}</Text>}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Danh sách ({items.length})</Text>
          {items.map((item) => (
            <Pressable key={item.assignment.id} style={[styles.assignmentRow, detailRequestId === item.request.id && styles.assignmentRowSelected]} onPress={() => void loadRequestDetail(item.request.id)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.assignmentTitle}>{item.serviceName}</Text>
                <Text style={styles.assignmentMeta}>{formatDateTime(item.assignment.assignedAt)} • {formatCurrency(item.assignment.estimatedCost.amount, item.assignment.estimatedCost.currency)}</Text>
              </View>
              <View style={[styles.statusPill, item.request.status === "IN_PROGRESS" ? styles.statusPillProgress : styles.statusPillAssigned]}>
                <Text style={styles.statusPillText}>{formatRequestStatus(item.request.status)}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {detail && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chi tiết</Text>
            <Text style={styles.detailText}>Khách: {customerProfile?.fullName || "-"}</Text>
            <Text style={styles.detailText}>SĐT: {customerProfile?.phoneNumber || "-"}</Text>
            <Text style={styles.detailText}>Mô tả: {detail.description}</Text>
            <Text style={styles.detailText}>Giá ước tính: {formatCurrency(detail.estimatedCost?.amount ?? 0, detail.estimatedCost?.currency ?? "VND")}</Text>
            <Text style={styles.detailText}>Địa chỉ: {detail.addressText}</Text>
            
            <View style={styles.actionRow}>
              {detail.status === "ASSIGNED" && (
                <ActionButton label="Bắt đầu" onPress={() => void handleStatusChange("IN_PROGRESS")} loading={loading} />
              )}
              {detail.status === "IN_PROGRESS" && (
                <>
                  <ActionButton label="Đề xuất tăng giá" onPress={() => setShowAdjustmentModal(true)} variant="secondary" />
                  <ActionButton label="Gửi hoàn thành" onPress={() => setShowCompletionModal(true)} loading={loading} />
                </>
              )}
            </View>
          </View>
        )}

        <Modal visible={showAdjustmentModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.cardTitle}>Đề xuất tăng giá</Text>
              <LabeledInput label="Giá mới" value={newPriceAmount} onChangeText={setNewPriceAmount} keyboardType="numeric" />
              <Text style={[styles.statusLabel, { marginTop: 10 }]}>Lý do:</Text>
              <TextInput style={styles.textArea} value={adjustmentReason} onChangeText={setAdjustmentReason} multiline numberOfLines={3} placeholder="Lý do..." />
              <View style={styles.actionRow}>
                <ActionButton label="Gửi" onPress={() => void handleCreateAdjustment()} loading={loading} />
                <ActionButton label="Hủy" onPress={() => {
                  setShowAdjustmentModal(false);
                  setNewPriceAmount("");
                  setAdjustmentReason("");
                }} variant="secondary" />
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showCompletionModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.cardTitle}>Gửi yêu cầu hoàn thành</Text>
              
              <View style={styles.imagePickerContainer}>
                {selectedImage ? (
                  <RNImage source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="image" size={40} color="#94a3b8" />
                    <Text style={styles.imagePlaceholderText}>Chưa có ảnh bằng chứng</Text>
                  </View>
                )}
                <Pressable style={styles.pickButton} onPress={() => void pickImage()}>
                  <Text style={styles.pickButtonText}>{selectedImage ? "Thay đổi ảnh" : "Chọn ảnh từ máy"}</Text>
                </Pressable>
              </View>

              <Text style={[styles.statusLabel, { marginTop: 10 }]}>Ghi chú:</Text>
              <TextInput style={styles.textArea} value={completionNotes} onChangeText={setCompletionNotes} multiline numberOfLines={3} placeholder="Mô tả kết quả công việc..." />
              <View style={styles.actionRow}>
                <ActionButton label="Gửi yêu cầu" onPress={() => void handleStatusChange("REQUEST_COMPLETION")} loading={loading} />
                <ActionButton label="Hủy" onPress={() => {
                  setShowCompletionModal(false);
                  setCompletionNotes("");
                  setEvidenceUrl("");
                  setSelectedImage(null);
                }} variant="secondary" />
              </View>
            </View>
          </View>
        </Modal>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f0f4ff" },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 14 },
  header: { flexDirection: "row", padding: 16, borderRadius: 20, backgroundColor: "#fff", gap: 12, alignItems: "center" },
  logoBox: { width: 40, height: 40, borderRadius: 10, overflow: "hidden" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  headerSub: { fontSize: 12, color: "#64748b" },
  errorBox: { backgroundColor: "#fef2f2", padding: 12, borderRadius: 12 },
  errorText: { color: colors.danger, fontSize: 13 },
  successBox: { backgroundColor: "#eff6ff", padding: 12, borderRadius: 12 },
  successText: { color: "#1d4ed8", fontSize: 13 },
  infoBox: { backgroundColor: "#f0f4ff", padding: 12, borderRadius: 12 },
  infoText: { color: "#64748b", fontSize: 13 },
  agentCard: { backgroundColor: "#fff", borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  agentCardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  agentAvatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  agentAvatarActive: { backgroundColor: "#dbeafe" },
  agentAvatarInactive: { backgroundColor: "#f1f5f9" },
  agentAvatarText: { fontSize: 18, fontWeight: "800" },
  agentName: { fontSize: 15, fontWeight: "800" },
  availText: { fontSize: 12, fontWeight: "600" },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  toggleBtnOn: { backgroundColor: "#2563eb" },
  toggleBtnOff: { backgroundColor: "#dc2626" },
  toggleBtnText: { color: "#fff", fontWeight: "700" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: "800" },
  assignmentRow: { flexDirection: "row", padding: 12, backgroundColor: "#f8fafc", borderRadius: 12, gap: 10 },
  assignmentRowSelected: { borderColor: colors.primary, borderWidth: 1 },
  assignmentTitle: { fontSize: 14, fontWeight: "700" },
  assignmentMeta: { fontSize: 12, color: "#64748b" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusPillAssigned: { backgroundColor: "#eff6ff" },
  statusPillProgress: { backgroundColor: "#fef3c7" },
  statusPillText: { fontSize: 10, fontWeight: "800" },
  detailText: { fontSize: 14, color: "#334155" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 20, padding: 20, gap: 12 },
  textArea: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, padding: 12, height: 80, textAlignVertical: "top" },
  statusLabel: { fontSize: 13, fontWeight: "700" },
  imagePickerContainer: {
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed"
  },
  previewImage: { width: "100%", height: 200, borderRadius: 12, resizeMode: "cover" },
  imagePlaceholder: { alignItems: "center", gap: 8, paddingVertical: 20 },
  imagePlaceholderText: { fontSize: 12, color: "#64748b" },
  pickButton: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  pickButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 }
});
