import { useCallback, useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp
} from "@react-navigation/native";
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
import type { StaffTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY,
  SERVICE_AGENTS_QUERY,
  SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
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
import type {
  AgentCapabilityItem,
  ServiceAgentItem,
  ServiceDefinition,
  ServiceRequestItem,
  UserProfile
} from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import {
  assignProvider,
  createActivityLog,
  createAssignment,
  evaluateComplexity,
  requestDeposit,
  searchServiceAgents,
  type ServiceAgentSearchItem
} from "../api/staffApi";

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface UsersResponse {
  getUsers: UserProfile[];
}

interface ServicesByCategoryResponse {
  getServiceDefinitionsByCategory: ServiceDefinition[];
}

interface AgentMatchCandidate {
  agent: ServiceAgentItem;
  capability: AgentCapabilityItem | null;
  score: number;
  recommended: boolean;
  supportsComplexity: boolean;
  supportsSelectedService: boolean;
  notes: string[];
}

type WorkspaceTab = "overview" | "complexity" | "service" | "agent";
type AgentAvailabilityFilter = "ALL" | "READY" | "BUSY";

const complexityLevels = [1, 2, 3, 4, 5] as const;

const workspaceTabLabels: Record<WorkspaceTab, string> = {
  overview: "Tổng quan",
  complexity: "Độ khó",
  service: "Dịch vụ",
  agent: "Thợ"
};

const availabilityFilterOptions: Array<{ label: string; value: AgentAvailabilityFilter }> = [
  { label: "Tất cả", value: "ALL" },
  { label: "Sẵn sàng", value: "READY" },
  { label: "Đang bận", value: "BUSY" }
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_REVIEW: { bg: "#fefce8", text: "#ca8a04" },
  COMPLETED: { bg: "#f0fdf4", text: "#16a34a" },
  ASSIGNED: { bg: "#eff6ff", text: "#2563eb" }
};

const getStatusStyle = (status?: string | null) =>
  STATUS_COLORS[status ?? ""] ?? { bg: "#f0f4ff", text: "#64748b" };

const isDispatchFlow = (request: ServiceRequestItem) =>
  request.status === "CREATED" || request.status === "PENDING_REVIEW";

const canAssignProvider = (request: ServiceRequestItem | null) =>
  request?.status === "PENDING_REVIEW";

const canEvaluateComplexity = (request: ServiceRequestItem | null) =>
  request?.status === "CREATED" || request?.status === "PENDING_REVIEW";

const getNextWorkspaceTab = (request: ServiceRequestItem | null): WorkspaceTab => {
  if (!request) return "overview";
  if (canEvaluateComplexity(request)) return "complexity";
  if (canAssignProvider(request)) return request.serviceDefinitionId ? "agent" : "service";
  return "overview";
};

const buildAgentMatch = (
  agent: ServiceAgentItem,
  request: ServiceRequestItem,
  selectedServiceId: string
): AgentMatchCandidate | null => {
  const requestLevel = request.complexity?.level ?? 3;
  const capabilities = agent.capabilities ?? [];
  const capability =
    capabilities.find((item) => item.categoryId === request.categoryId) ?? null;

  if (!agent.isActive || !capability) return null;

  const maxComplexity = capability.maxComplexity?.level ?? 0;
  const supportsComplexity = maxComplexity >= requestLevel;
  let supportsSelectedService = true;
  let score = 45;
  const notes = ["Đúng danh mục", `Hỗ trợ tới mức ${maxComplexity}`];

  if (supportsComplexity) {
    score += Math.min(25, Math.max(10, (maxComplexity - requestLevel + 1) * 5));
  } else {
    score -= 10;
    notes.push(`Đơn hiện ở mức ${requestLevel}, cần người hỗ trợ cao hơn`);
  }

  if (selectedServiceId) {
    const serviceIds = capability.serviceIds ?? [];
    if (serviceIds.length === 0) {
      score += 15;
      notes.push("Có thể nhận mọi dịch vụ trong danh mục");
    } else if (serviceIds.includes(selectedServiceId)) {
      score += 20;
      notes.push("Khớp dịch vụ của đơn");
    } else {
      supportsSelectedService = false;
      score -= 5;
      notes.push("Chưa gắn năng lực cho dịch vụ này");
    }
  }

  const normalizedScore = Math.max(10, Math.min(100, Math.round(score)));
  return {
    agent,
    capability,
    score: normalizedScore,
    recommended: supportsComplexity && supportsSelectedService && normalizedScore >= 80,
    supportsComplexity,
    supportsSelectedService,
    notes
  };
};

export default function DispatchCenterScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<StaffTabParamList>>();
  const route = useRoute<RouteProp<StaffTabParamList, "DispatchCenter">>();
  const { session } = useAuth();
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [complexityLevel, setComplexityLevel] = useState<number>(3);
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [currency, setCurrency] = useState("VND");
  const [agents, setAgents] = useState<ServiceAgentItem[]>([]);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [customerNamesById, setCustomerNamesById] = useState<Record<string, string>>({});
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsManualRequestSelection, setNeedsManualRequestSelection] = useState(false);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("overview");
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchResult, setSearchResult] = useState<{ items: ServiceAgentSearchItem[], total: number }>({ items: [], total: 0 });
  const [agentAvailabilityFilter, setAgentAvailabilityFilter] = useState<AgentAvailabilityFilter>("ALL");

  const applyMatchSelection = (match: AgentMatchCandidate | null) => {
    setSelectedAgentId(match?.agent.id ?? "");
  };

  const dispatchRequests = useMemo(
    () =>
      requests
        .filter(isDispatchFlow)
        .sort((left, right) => {
          const leftPriority =
            left.status === "CREATED" ? 0 : 1;
          const rightPriority =
            right.status === "CREATED" ? 0 : 1;

          if (leftPriority !== rightPriority) return leftPriority - rightPriority;
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        }),
    [requests]
  );

  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) ?? null,
    [requests, selectedRequestId]
  );

  const selectedService = useMemo(
    () => services.find((item) => item.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const selectedRequestLevel = selectedRequest?.complexity?.level ?? complexityLevel;

  const agentMatches = useMemo(() => {
    if (!selectedRequest || !selectedServiceId) return [];
    return agents
      .map((agent) => buildAgentMatch(agent, selectedRequest, selectedServiceId))
      .filter((item): item is AgentMatchCandidate => item !== null)
      .sort((left, right) => {
        if (left.recommended !== right.recommended) return left.recommended ? -1 : 1;
        if (left.supportsSelectedService !== right.supportsSelectedService)
          return left.supportsSelectedService ? -1 : 1;
        if (left.supportsComplexity !== right.supportsComplexity)
          return left.supportsComplexity ? -1 : 1;
        return right.score - left.score;
      });
  }, [agents, selectedRequest, selectedServiceId]);

  const readyAgentMatches = useMemo(
    () => agentMatches.filter((item) => item.supportsComplexity && item.supportsSelectedService),
    [agentMatches]
  );

  const reviewAgentMatches = useMemo(
    () => agentMatches.filter((item) => !item.supportsComplexity || !item.supportsSelectedService),
    [agentMatches]
  );

  const selectedAgentMatch = useMemo(
    () => agentMatches.find((item) => item.agent.id === selectedAgentId) ?? null,
    [agentMatches, selectedAgentId]
  );

  const activeAgents = useMemo(() => agents.filter((agent) => agent.isActive), [agents]);

  const activeAgentsWithCapabilities = useMemo(
    () => activeAgents.filter((agent) => (agent.capabilities?.length ?? 0) > 0),
    [activeAgents]
  );

  const busyAgentIds = useMemo(() => {
    return new Set(
      requests
        .filter(r =>
          r.status === "ASSIGNED" ||
          r.status === "IN_PROGRESS" ||
          r.status === "AWAITING_COMPLETION_REVIEW"
        )
        .map(r => r.assignedProviderId)
        .filter((id): id is string => !!id)
    );
  }, [requests]);

  const matchesAvailabilityFilter = useCallback((agentId: string) => {
    const isBusy = busyAgentIds.has(agentId);

    if (agentAvailabilityFilter === "READY") {
      return !isBusy;
    }

    if (agentAvailabilityFilter === "BUSY") {
      return isBusy;
    }

    return true;
  }, [agentAvailabilityFilter, busyAgentIds]);

  const visibleAgentMatches = useMemo(
    () => agentMatches.filter((item) => matchesAvailabilityFilter(item.agent.id)),
    [agentMatches, matchesAvailabilityFilter]
  );

  const filteredReadyAgentMatches = useMemo(
    () => readyAgentMatches.filter((item) => matchesAvailabilityFilter(item.agent.id)),
    [readyAgentMatches, matchesAvailabilityFilter]
  );

  const filteredReviewAgentMatches = useMemo(
    () => reviewAgentMatches.filter((item) => matchesAvailabilityFilter(item.agent.id)),
    [reviewAgentMatches, matchesAvailabilityFilter]
  );

  const getCustomerName = (customerId?: string | null) =>
    customerId ? customerNamesById[customerId] ?? formatShortId(customerId) : "-";

  const getAgentName = (agentId?: string | null) =>
    agentId
      ? agents.find((agent) => agent.id === agentId)?.fullName ?? formatShortId(agentId)
      : "Chưa gán";

  const getAiValueLabel = (value?: string | null, wasAnalyzedByAI?: boolean) => {
    if (value?.trim()) return value;
    return wasAnalyzedByAI ? "AI chưa trả về" : "Chưa phân tích AI";
  };

  const getEstimatedCostLabel = (request?: ServiceRequestItem | null) => {
    const price = request?.finalPrice || request?.estimatedCost;
    return price ? formatCurrency(price.amount, price.currency) : "Chưa có";
  };

  const getRequestedServiceLabel = (request?: ServiceRequestItem | null) => {
    if (!request?.serviceDefinitionId) return "Khách chưa chốt dịch vụ";
    return (
      services.find((item) => item.id === request.serviceDefinitionId)?.name ??
      formatShortId(request.serviceDefinitionId)
    );
  };

  const loadInitialData = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      const [agentData, requestData, userData] = await Promise.all([
        graphqlRequest<ServiceAgentsResponse>(SERVICE_AGENTS_QUERY, undefined, session.accessToken),
        graphqlRequest<AllRequestsResponse>(ALL_REQUESTS_QUERY, undefined, session.accessToken),
        graphqlRequest<UsersResponse>(USERS_QUERY, undefined, session.accessToken)
      ]);
      setCustomerNamesById(Object.fromEntries(userData.getUsers.map((user) => [user.id, user.fullName])));
      setAgents(agentData.getServiceAgents);
      setRequests(normalizeServiceRequests(requestData.getServiceRequests));
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [session]);

  const loadRequestContext = async (request: ServiceRequestItem) => {
    if (!session) return;
    if (!request.categoryId) {
      setServices([]);
      setSelectedServiceId("");
      setEstimatedAmount("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const serviceData = await graphqlRequest<ServicesByCategoryResponse, { categoryId: string }>(
        SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
        { categoryId: request.categoryId },
        session.accessToken
      );
      const availableServices = serviceData.getServiceDefinitionsByCategory.filter(
        (service) => service.isActive || service.id === request.serviceDefinitionId
      );
      setServices(availableServices);
      const nextService =
        availableServices.find((item) => item.id === request.serviceDefinitionId) ??
        availableServices.find((item) => item.id === selectedServiceId) ??
        availableServices[0];
      if (nextService) {
        setSelectedServiceId(nextService.id);
        setEstimatedAmount(String(nextService.basePrice));
      } else {
        setSelectedServiceId("");
        setEstimatedAmount("");
      }
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadAgentsData = async () => {
    if (!session || !selectedRequest || !selectedServiceId) return;
    setLoading(true);
    try {
      const result = await searchServiceAgents(session.accessToken, {
        categoryId: selectedRequest.categoryId ?? undefined,
        serviceId: selectedServiceId,
        minComplexity: selectedRequest.complexity?.level ?? complexityLevel,
        page: searchPage,
        pageSize: 5
      });
      setSearchResult({ items: result.items, total: result.totalCount });
      if (result.items.length > 0 && !selectedAgentId) {
        setSelectedAgentId(result.items[0].id);
      }
    } catch (err) {
      setError(asErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "agent" && isWorkspaceOpen) {
      void loadAgentsData();
    }
  }, [activeTab, isWorkspaceOpen, searchPage, selectedServiceId, complexityLevel]);

  const handleSelectRequest = (request: ServiceRequestItem) => {
    setNeedsManualRequestSelection(false);
    setSelectedRequestId(request.id);
    setComplexityLevel(request.complexity?.level ?? 3);
    setSelectedAgentId("");
    setSuccess("");
    setError("");
    setActiveTab(getNextWorkspaceTab(request));
    setIsWorkspaceOpen(true);
  };

  const handleSelectService = (service: ServiceDefinition) => {
    setSelectedServiceId(service.id);
    setEstimatedAmount(String(service.basePrice));
    setSelectedAgentId("");
    setSuccess("");
    setActiveTab("agent");
  };

  const handleSelectAgent = (match: AgentMatchCandidate) => {
    applyMatchSelection(match);
    setSuccess("");
  };

  const closeWorkspace = () => {
    setIsWorkspaceOpen(false);
    setError("");
    setSuccess("");
    navigation.setParams({ requestId: undefined });
  };

  const handleEvaluateComplexity = async () => {
    if (!session || !selectedRequest) {
      setError("Hãy chọn yêu cầu cần xử lý");
      return;
    }
    if (!canEvaluateComplexity(selectedRequest)) {
      setError("Chỉ yêu cầu ở trạng thái Mới tạo hoặc Chờ duyệt mới có thể đánh giá độ phức tạp.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const isReevaluation = selectedRequest.status === "PENDING_REVIEW";
      // Loại bỏ dấu chấm trước khi parse (thói quen nhập liệu hàng nghìn của VN)
      const cleanAmount = estimatedAmount.toString().replace(/\./g, "");
      const amount = Number.parseFloat(cleanAmount);
      const money = !Number.isNaN(amount) ? { amount, currency: currency.trim() || "VND" } : undefined;

      await evaluateComplexity(
        session.accessToken,
        selectedRequest.id,
        complexityLevel,
        selectedServiceId || undefined,
        money
      );
      await createActivityLog(session.accessToken, {
        serviceRequestId: selectedRequest.id,
        action: `Staff evaluated complexity ${complexityLevel} before dispatch`
      });
      setSuccess(
        isReevaluation
          ? "Đã cập nhật lại độ phức tạp. Tiếp theo bạn có thể kiểm tra service và chọn thợ ngay trong màn này."
          : "Đã đánh giá độ phức tạp. Tiếp theo hãy kiểm tra service và chọn thợ phù hợp."
      );
      setActiveTab("service");
      await loadInitialData();
    } catch (actionError: any) {
      console.error("EvaluateComplexity Error:", actionError);
      let errorMsg = asErrorMessage(actionError);
      if (actionError?.details && Array.isArray(actionError.details) && actionError.details.length > 0) {
        const detail = actionError.details[0];
        if (detail.exceptionMsg) {
          errorMsg += `\nLý do: ${detail.exceptionMsg}`;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProviderAndCreateAssignment = async () => {
    if (!session || !selectedRequest) {
      setError("Hãy chọn yêu cầu cần điều phối");
      return;
    }
    if (!canAssignProvider(selectedRequest)) {
      setError("Hãy đánh giá độ phức tạp trước khi phân công thợ.");
      return;
    }
    if (!selectedServiceId.trim()) {
      setError("Hãy chọn một service đang hoạt động trước khi phân công thợ.");
      return;
    }
    if (!selectedAgentId.trim()) {
      setError("Hãy chọn thợ trước khi phân công");
      return;
    }
    if (!selectedAgentMatch?.supportsComplexity) {
      setError("Thợ đang chọn chưa đủ mức độ phức tạp cho đơn này.");
      return;
    }
    if (!selectedAgentMatch.supportsSelectedService) {
      setError("Thợ đang chọn chưa được gắn cho dịch vụ này. Hãy đổi dịch vụ hoặc chọn thợ khác.");
      return;
    }
    // Loại bỏ dấu chấm trước khi parse (thói quen nhập liệu hàng nghìn của VN)
    const cleanAmount = estimatedAmount.toString().replace(/\./g, "");
    const amount = Number.parseFloat(cleanAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setError("Chi phí ước tính phải là số không âm");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const money = { amount, currency: currency.trim() || "VND" };
      await assignProvider(session.accessToken, selectedRequest.id, {
        providerId: selectedAgentId,
        estimatedCost: money
      });
      const assignmentId = await createAssignment(session.accessToken, {
        serviceRequestId: selectedRequest.id,
        agentId: selectedAgentId,
        estimatedCost: money
      });
      await createActivityLog(session.accessToken, {
        serviceRequestId: selectedRequest.id,
        action: `Staff assigned provider ${selectedAgentId} with assignment ${assignmentId}`
      });
      setSuccess("Đã phân công xong đơn này. Bạn có thể quay lại hàng chờ hoặc xem lịch sử nếu cần.");
      setNeedsManualRequestSelection(true);
      setIsWorkspaceOpen(false);
      setSelectedRequestId("");
      setSelectedAgentId("");
      setSelectedServiceId("");
      setEstimatedAmount("");
      setActiveTab("overview");
      navigation.setParams({ requestId: undefined });
      await loadInitialData();
    } catch (actionError: any) {
      console.error("AssignProvider Error:", actionError);
      let errorMsg = asErrorMessage(actionError);
      if (actionError?.details && Array.isArray(actionError.details) && actionError.details.length > 0) {
        const detail = actionError.details[0];
        if (detail.exceptionMsg) {
          errorMsg += `\nLý do: ${detail.exceptionMsg}`;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeposit = async () => {
    if (!session || !selectedRequest) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // 20% deposit based on estimated cost
      const amount = selectedRequest.estimatedCost?.amount ?? 0;
      await requestDeposit(
        session.accessToken,
        selectedRequest.id,
        { amount: Math.floor(amount * 0.2), currency: "VND" },
        0.2
      );
      await createActivityLog(session.accessToken, {
        serviceRequestId: selectedRequest.id,
        action: `Staff requested deposit for request ${selectedRequest.id}`
      });
      setSuccess("Đã gửi yêu cầu đặt cọc thành công cho khách hàng.");
      await loadInitialData();
    } catch (err) {
      setError(asErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderActionPanel = () => (
    <View style={styles.actionPanel}>
      <Text style={styles.actionTitle}>Phân công trực tiếp</Text>
      <Text style={styles.metaText}>
        Đơn: {selectedRequest?.description || "-"} • Service: {selectedService?.name || "-"} • Thợ: {selectedAgentMatch?.agent.fullName || "-"}
      </Text>
      {selectedAgentMatch && !selectedAgentMatch.supportsComplexity ? (
        <Text style={styles.warningText}>Thợ đang chọn chưa đủ mức độ phức tạp cho đơn này, nên chưa thể phân công.</Text>
      ) : null}
      {selectedAgentMatch && !selectedAgentMatch.supportsSelectedService ? (
        <Text style={styles.warningText}>Thợ đang chọn chưa được gắn cho dịch vụ hiện tại. Hãy đổi dịch vụ hoặc chọn thợ khác trước khi phân công.</Text>
      ) : null}
      <LabeledInput
        label="Chi phí ước tính"
        value={estimatedAmount}
        onChangeText={setEstimatedAmount}
        keyboardType="numeric"
        hint="Mặc định theo service đang chọn, có thể sửa trước khi phân công."
      />
      <LabeledInput label="Đơn vị tiền tệ" value={currency} onChangeText={setCurrency} />
      <ActionButton
        label={loading ? "Đang phân công..." : "Phân công thợ"}
        onPress={() => void handleAssignProviderAndCreateAssignment()}
        disabled={
          loading ||
          !selectedRequest ||
          !selectedServiceId ||
          !selectedAgentId ||
          !selectedAgentMatch?.supportsComplexity ||
          !selectedAgentMatch?.supportsSelectedService ||
          !canAssignProvider(selectedRequest)
        }
      />
      {!canAssignProvider(selectedRequest) && selectedRequest ? (
        <Text style={styles.warningText}>Staff chỉ có thể gán thợ khi yêu cầu đã ở trạng thái Chờ duyệt.</Text>
      ) : null}
    </View>
  );

  useFocusEffect(
    useCallback(() => {
      void loadInitialData();
    }, [loadInitialData])
  );

  useEffect(() => {
    const routeRequestId = route.params?.requestId;
    if (!routeRequestId) return;
    const routeRequest = requests.find((item) => item.id === routeRequestId) ?? null;
    setNeedsManualRequestSelection(false);
    setSelectedRequestId(routeRequestId);
    setActiveTab(getNextWorkspaceTab(routeRequest));
    setIsWorkspaceOpen(true);
  }, [requests, route.params?.requestId]);

  useEffect(() => {
    const stillExists = requests.some((item) => item.id === selectedRequestId);
    if (selectedRequestId && !stillExists) {
      setSelectedRequestId("");
      setIsWorkspaceOpen(false);
      return;
    }
    if (!selectedRequestId && !needsManualRequestSelection && dispatchRequests.length > 0) {
      setSelectedRequestId(dispatchRequests[0].id);
    }
  }, [dispatchRequests, needsManualRequestSelection, requests, selectedRequestId]);

  useEffect(() => {
    if (!selectedRequest) {
      setServices([]);
      setSelectedServiceId("");
      setSelectedAgentId("");
      return;
    }
    setComplexityLevel(selectedRequest.complexity?.level ?? 3);
    void loadRequestContext(selectedRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest, session?.accessToken]);

  useEffect(() => {
    if (!selectedAgentMatch && visibleAgentMatches.length > 0) {
      applyMatchSelection(filteredReadyAgentMatches[0] ?? visibleAgentMatches[0] ?? null);
      return;
    }

    if (!selectedAgentId) return;

    const stillEligible = visibleAgentMatches.some((item) => item.agent.id === selectedAgentId);
    if (!stillEligible) {
      applyMatchSelection(filteredReadyAgentMatches[0] ?? visibleAgentMatches[0] ?? null);
    }
  }, [filteredReadyAgentMatches, selectedAgentId, selectedAgentMatch, visibleAgentMatches]);

  // ✅ Theo yêu cầu: title luôn giữ nguyên, không đổi theo request
  const screenTitle = "Điều phối và gán thợ";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{screenTitle}</Text>
              <Text style={styles.headerSub}>
                {isWorkspaceOpen ? "Đang điều phối một yêu cầu cụ thể" : "Chạm vào một yêu cầu để mở điều phối"}
              </Text>
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

        {isWorkspaceOpen ? (
          selectedRequest ? (
            <>
              {/* Workspace: request info */}
              <View style={[styles.card, { borderColor: colors.primary }]}>
                <View style={styles.workspaceTop}>
                  <Text style={styles.requestDesc} numberOfLines={2}>
                    {selectedRequest.description}
                  </Text>

                  <Pressable style={styles.backIconBtn} onPress={closeWorkspace} hitSlop={10}>
                    <MaterialIcons name="keyboard-return" size={20} color={colors.primary} />
                  </Pressable>
                </View>
                <View style={styles.badgeRow}>
                  {(() => {
                    const statusStyle = getStatusStyle(selectedRequest.status);
                    return (
                      <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                          {formatRequestStatus(selectedRequest.status)}
                        </Text>
                      </View>
                    );
                  })()}
                  <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                    <Text style={[styles.statusText, { color: "#2563eb" }]}>
                      {formatDateTime(selectedRequest.createdAt)}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: "#f0f4ff" }]}>
                    <Text style={[styles.statusText, { color: "#64748b" }]}>
                      Khách: {getCustomerName(selectedRequest.customerId)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Workspace: request details */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Thông tin yêu cầu</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.subTitle}>Thông tin chính</Text>
                  <Text style={styles.metaText}>Mã yêu cầu: {formatShortId(selectedRequest.id)}</Text>
                  <Text style={styles.metaText}>Khách hàng: {getCustomerName(selectedRequest.customerId)}</Text>
                  <Text style={styles.metaText}>Tạo lúc: {formatDateTime(selectedRequest.createdAt)}</Text>
                  <Text style={styles.metaText}>Độ phức tạp: Mức {selectedRequestLevel}</Text>
                  <Text style={styles.metaText}>Dịch vụ khách chọn: {getRequestedServiceLabel(selectedRequest)}</Text>
                  <Text style={styles.metaText}>Service staff đang áp dụng: {selectedService?.name || "Chưa chọn"}</Text>
                  <Text style={styles.metaText}>Chi phí ước tính hiện tại: {getEstimatedCostLabel(selectedRequest)}</Text>
                  <Text style={styles.metaText}>Thợ hiện tại: {getAgentName(selectedRequest.assignedProviderId)}</Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.subTitle}>Hiện trường và phân tích</Text>
                  <Text style={styles.metaText}>
                    Địa chỉ: {selectedRequest.addressText || "Khách hàng chưa nhập địa chỉ cho yêu cầu này."}
                  </Text>
                  <Text style={styles.metaText}>
                    AI báo giá: {getAiValueLabel(selectedRequest.estimatedPrice, selectedRequest.wasAnalyzedByAI)}
                  </Text>
                  <Text style={styles.metaText}>
                    AI dự kiến: {getAiValueLabel(selectedRequest.estimatedDuration, selectedRequest.wasAnalyzedByAI)}
                  </Text>
                  {selectedRequest.ocrExtractedText ? (
                    <Text style={styles.metaText}>Nội dung từ ảnh: {selectedRequest.ocrExtractedText}</Text>
                  ) : null}
                </View>

                <View style={styles.actionGroup}>
                  {selectedRequest.assignedProviderId ? (
                    <View style={styles.actionGroup}>
                      {selectedRequest.status === "PENDING_REVIEW" && (
                        <ActionButton
                          label={loading ? "Đang xử lý..." : "Yêu cầu đặt cọc"}
                          variant="primary"
                          onPress={() => void handleRequestDeposit()}
                          disabled={loading}
                        />
                      )}
                      <ActionButton
                        label="Xem lịch sử phân công"
                        onPress={() => navigation.navigate("DispatchHistory", { requestId: selectedRequest.id })}
                        variant="secondary"
                      />
                    </View>
                  ) : null}
                  <ActionButton
                    label={loading ? "Đang làm mới..." : "Làm mới dữ liệu"}
                    onPress={() => void loadInitialData()}
                    disabled={loading}
                    variant="secondary"
                  />
                </View>
              </View>

              {/* Workspace: dispatch actions */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Thao tác điều phối</Text>
                <View style={styles.chipRow}>
                  {(Object.keys(workspaceTabLabels) as WorkspaceTab[]).map((tab) => {
                    const active = activeTab === tab;
                    return (
                      <Pressable key={tab} style={[styles.chip, active && styles.chipActive]} onPress={() => setActiveTab(tab)}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{workspaceTabLabels[tab]}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {activeTab === "overview" ? (
                  <View style={styles.panelStack}>
                    <Text style={styles.metaText}>Trạng thái hiện tại: {formatRequestStatus(selectedRequest.status)}</Text>
                    <Text style={styles.metaText}>Service đang áp dụng: {selectedService?.name || "Chưa chọn"}</Text>
                    <Text style={styles.metaText}>Thợ đang nhắm tới: {selectedAgentMatch?.agent.fullName || "Chưa chọn"}</Text>
                    <View style={styles.actionGroup}>
                      {canEvaluateComplexity(selectedRequest) ? (
                        <ActionButton label="Đánh giá độ khó" onPress={() => setActiveTab("complexity")} variant="secondary" />
                      ) : null}
                      <ActionButton label="Chọn service" onPress={() => setActiveTab("service")} variant="secondary" />
                      <ActionButton
                        label="Chọn thợ"
                        onPress={() => setActiveTab(selectedServiceId ? "agent" : "service")}
                        variant="secondary"
                      />
                    </View>
                  </View>
                ) : null}

                {activeTab === "complexity" ? (
                  <View style={styles.panelStack}>
                    <Text style={styles.metaText}>
                      {selectedRequest.status === "PENDING_REVIEW"
                        ? "Bạn có thể đánh giá lại độ phức tạp trước khi phân công."
                        : selectedRequest.status === "CREATED"
                          ? "Hãy đánh giá độ phức tạp trước khi phân công thợ."
                          : "Yêu cầu khẩn hiện chưa có bước đánh giá riêng trên màn này."}
                    </Text>
                    <View style={styles.chipRow}>
                      {complexityLevels.map((level) => {
                        const active = level === complexityLevel;
                        return (
                          <Pressable key={level} style={[styles.chip, active && styles.chipActive]} onPress={() => setComplexityLevel(level)}>
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>Mức {level}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <ActionButton
                      label={
                        loading
                          ? "Đang đánh giá..."
                          : selectedRequest.status === "PENDING_REVIEW"
                            ? "Đánh giá lại độ phức tạp"
                            : selectedRequest.status === "CREATED"
                              ? "Đánh giá độ phức tạp"
                              : "Không áp dụng cho trạng thái này"
                      }
                      onPress={() => void handleEvaluateComplexity()}
                      disabled={loading || !canEvaluateComplexity(selectedRequest)}
                      variant="secondary"
                    />
                    {canAssignProvider(selectedRequest) ? (
                      <ActionButton label="Tiếp tục qua service" onPress={() => setActiveTab("service")} variant="secondary" />
                    ) : null}
                  </View>
                ) : null}

                {activeTab === "service" ? (
                  <View style={styles.panelStack}>
                    {!canAssignProvider(selectedRequest) ? (
                      <>
                        <Text style={styles.warningText}>Staff cần đánh giá độ phức tạp trước khi chọn service.</Text>
                        <ActionButton label="Quay lại đánh giá độ khó" onPress={() => setActiveTab("complexity")} variant="secondary" />
                      </>
                    ) : services.length > 0 ? (
                      <>
                        {selectedService ? (
                          <View style={styles.selectedCard}>
                            <Text style={styles.selectedTitle}>Đang áp dụng: {selectedService.name}</Text>
                            <View style={styles.badgeRow}>
                              <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                                <Text style={[styles.statusText, { color: "#2563eb" }]}>
                                  {formatCurrency(selectedService.basePrice)}
                                </Text>
                              </View>
                              <View style={[styles.statusPill, { backgroundColor: "#f0f4ff" }]}>
                                <Text style={[styles.statusText, { color: "#64748b" }]}>
                                  {selectedService.estimatedDuration} phút
                                </Text>
                              </View>
                              {!selectedService.isActive ? (
                                <View style={[styles.statusPill, { backgroundColor: "#fef2f2" }]}>
                                  <Text style={[styles.statusText, { color: "#dc2626" }]}>Tạm ngưng</Text>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        ) : null}
                        <View style={styles.optionStack}>
                          {services.map((service) => (
                            <Pressable
                              key={service.id}
                              style={[styles.optionCard, selectedServiceId === service.id && styles.optionCardActive]}
                              onPress={() => handleSelectService(service)}
                            >
                              <Text style={styles.selectedTitle}>{service.name}</Text>
                              <Text style={styles.metaText}>{service.description || "Chưa có mô tả"}</Text>
                              <Text style={styles.metaText}>Giá cơ sở: {formatCurrency(service.basePrice)}</Text>
                              <Text style={styles.metaText}>Thời gian chuẩn: {service.estimatedDuration} phút</Text>
                            </Pressable>
                          ))}
                        </View>
                        <ActionButton label="Tiếp tục qua chọn thợ" onPress={() => setActiveTab("agent")} variant="secondary" />
                      </>
                    ) : (
                      <Text style={styles.metaText}>Danh mục này chưa có service đang hoạt động để staff chọn.</Text>
                    )}
                  </View>
                ) : null}

                {activeTab === "agent" ? (
                  <View style={styles.panelStack}>
                    {!canAssignProvider(selectedRequest) ? (
                      <>
                        <Text style={styles.warningText}>Staff cần đánh giá độ phức tạp trước khi chọn thợ.</Text>
                        <ActionButton label="Quay lại đánh giá độ khó" onPress={() => setActiveTab("complexity")} variant="secondary" />
                      </>
                    ) : !selectedServiceId ? (
                      <>
                        <Text style={styles.warningText}>Hãy chọn service áp dụng cho đơn trước khi xem gợi ý thợ phù hợp.</Text>
                        <ActionButton label="Quay lại chọn service" onPress={() => setActiveTab("service")} variant="secondary" />
                      </>
                    ) : agentMatches.length > 0 ? (
                      <>
                        <View style={styles.optionStack}>
                          <Text style={styles.subTitle}>Lọc trạng thái thợ</Text>
                          <View style={styles.chipRow}>
                            {availabilityFilterOptions.map((option) => {
                              const active = agentAvailabilityFilter === option.value;
                              return (
                                <Pressable
                                  key={option.value}
                                  style={[styles.chip, active && styles.chipActive]}
                                  onPress={() => setAgentAvailabilityFilter(option.value)}
                                >
                                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{option.label}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          <Text style={styles.metaText}>
                            Hiển thị {visibleAgentMatches.length}/{agentMatches.length} thợ theo bộ lọc.
                          </Text>
                        </View>

                        {filteredReadyAgentMatches.length > 0 ? (
                          <View style={styles.optionStack}>
                            <Text style={styles.subTitle}>Có thể gán ngay</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalAgentScroll}>
                              {filteredReadyAgentMatches.map((match) => {
                                const isBusy = busyAgentIds.has(match.agent.id);
                                return (
                                  <View key={match.agent.id} style={styles.agentCardWrapper}>
                                    <Pressable
                                      style={[
                                        styles.optionCardHorizontal,
                                        selectedAgentId === match.agent.id && styles.optionCardActive
                                      ]}
                                      onPress={() => handleSelectAgent(match)}
                                    >
                                      <View style={styles.agentHeader}>
                                        <Text style={[styles.selectedTitle, styles.agentNameText]} numberOfLines={1}>{match.agent.fullName}</Text>
                                        <View style={[styles.statusPill, styles.agentStatusPill, { backgroundColor: isBusy ? "#fef2f2" : "#f0fdf4" }]}>
                                          <Text numberOfLines={1} style={[styles.statusText, styles.agentStatusText, { color: isBusy ? "#dc2626" : "#16a34a" }]}>
                                            {isBusy ? "Đang bận" : "Sẵn sàng"}
                                          </Text>
                                        </View>
                                      </View>
                                      <Text style={styles.metaText}>Mức tối đa: {match.capability?.maxComplexity?.level ?? "?"}</Text>
                                      <Text style={styles.metaText}>Điểm gợi ý: {match.score}</Text>
                                      <Text style={styles.metaText} numberOfLines={1}>{match.notes.join(" · ")}</Text>
                                    </Pressable>
                                  </View>
                                );
                              })}
                            </ScrollView>
                            {selectedAgentMatch && filteredReadyAgentMatches.some(m => m.agent.id === selectedAgentId) ? renderActionPanel() : null}
                          </View>
                        ) : null}

                        {filteredReviewAgentMatches.length > 0 ? (
                          <View style={styles.optionStack}>
                            <Text style={styles.subTitle}>Cần rà soát thêm</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalAgentScroll}>
                              {filteredReviewAgentMatches.map((match) => {
                                const isBusy = busyAgentIds.has(match.agent.id);
                                return (
                                  <View key={match.agent.id} style={styles.agentCardWrapper}>
                                    <Pressable
                                      style={[
                                        styles.optionCardHorizontal,
                                        styles.optionCardMuted,
                                        selectedAgentId === match.agent.id && styles.optionCardActive
                                      ]}
                                      onPress={() => handleSelectAgent(match)}
                                    >
                                      <View style={styles.agentHeader}>
                                        <Text style={[styles.selectedTitle, styles.agentNameText]} numberOfLines={1}>{match.agent.fullName}</Text>
                                        <View style={[styles.statusPill, styles.agentStatusPill, { backgroundColor: isBusy ? "#fef2f2" : "#f0fdf4" }]}>
                                          <Text numberOfLines={1} style={[styles.statusText, styles.agentStatusText, { color: isBusy ? "#dc2626" : "#16a34a" }]}>
                                            {isBusy ? "Đang bận" : "Sẵn sàng"}
                                          </Text>
                                        </View>
                                      </View>
                                      <Text style={styles.metaText}>Mức tối đa: {match.capability?.maxComplexity?.level ?? "?"}</Text>
                                      <Text style={styles.metaText}>Điểm tham khảo: {match.score}</Text>
                                      <Text style={styles.metaText} numberOfLines={1}>{match.notes.join(" · ")}</Text>
                                    </Pressable>
                                  </View>
                                );
                              })}
                            </ScrollView>
                            {selectedAgentMatch && filteredReviewAgentMatches.some(m => m.agent.id === selectedAgentId) ? renderActionPanel() : null}
                          </View>
                        ) : null}

                        {filteredReadyAgentMatches.length === 0 && filteredReviewAgentMatches.length === 0 ? (
                          <Text style={styles.metaText}>Bộ lọc hiện tại không có thợ phù hợp. Hãy đổi bộ lọc để xem thêm.</Text>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <Text style={styles.metaText}>
                          {activeAgents.length === 0
                            ? "Hiện chưa có thợ nào đang hoạt động để staff phân công."
                            : activeAgentsWithCapabilities.length === 0
                              ? "Danh sách thợ đã tải nhưng hệ thống chưa trả về dữ liệu năng lực của thợ."
                              : "Chưa có thợ nào cùng danh mục cho đơn này. Hãy kiểm tra lại hồ sơ năng lực của thợ."}
                        </Text>
                        {activeAgents.length > 0 && activeAgentsWithCapabilities.length === 0 ? (
                          <Text style={styles.warningText}>
                            Đây thường là dấu hiệu backend chưa trả kèm capabilities cho query thợ. Hãy chạy backend mới nhất rồi tải lại màn hình.
                          </Text>
                        ) : null}
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Đang mở điều phối</Text>
              <Text style={styles.metaText}>
                {loading ? "Đang tải thông tin yêu cầu..." : "Không tìm thấy yêu cầu này trong luồng điều phối hiện tại."}
              </Text>
              <ActionButton label="Quay lại hàng chờ" onPress={closeWorkspace} variant="secondary" />
            </View>
          )
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tổng quan điều phối</Text>
              <View style={styles.countRow}>
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>{dispatchRequests.length}</Text>
                  <Text style={styles.countLabel}>Đơn chờ</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>{activeAgents.length}</Text>
                  <Text style={styles.countLabel}>Thợ online</Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countNumber}>{services.length}</Text>
                  <Text style={styles.countLabel}>Service</Text>
                </View>
              </View>
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.loadingText}>Đang đồng bộ...</Text>
                </View>
              ) : null}
              <ActionButton
                label={loading ? "Đang làm mới..." : "Làm mới dữ liệu"}
                onPress={() => void loadInitialData()}
                disabled={loading}
                variant="secondary"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Hàng chờ điều phối ({dispatchRequests.length})</Text>
              <Text style={styles.hintText}>Chạm vào một yêu cầu để mở màn điều phối riêng</Text>
              <View style={styles.queueList}>
                {dispatchRequests.length > 0 ? (
                  dispatchRequests.map((request) => {
                    const statusStyle = getStatusStyle(request.status);
                    return (
                      <Pressable
                        key={request.id}
                        style={[styles.queueCard, selectedRequestId === request.id && styles.queueCardActive]}
                        onPress={() => handleSelectRequest(request)}
                      >
                        <View style={styles.queueHeader}>
                          <Text style={styles.queueTitle}>{request.description}</Text>
                          <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                            <Text style={[styles.statusText, { color: statusStyle.text }]}>
                              {formatRequestStatus(request.status)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.metaText}>Khách hàng: {getCustomerName(request.customerId)}</Text>
                        <Text style={styles.metaText}>Độ phức tạp: Mức {request.complexity?.level ?? 3}</Text>
                        <Text style={styles.metaText}>Chi phí ước tính: {getEstimatedCostLabel(request)}</Text>
                        <Text style={styles.metaText}>Thợ đã gán: {getAgentName(request.assignedProviderId)}</Text>
                        <Text style={styles.metaText}>Địa chỉ: {request.addressText || "Khách hàng chưa nhập địa chỉ cho yêu cầu này."}</Text>
                        <Text style={styles.hintText}>Chạm vào card để mở màn điều phối riêng.</Text>
                        <View style={styles.badgeRow}>
                          <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                            <Text style={[styles.statusText, { color: "#2563eb" }]}>{formatDateTime(request.createdAt)}</Text>
                          </View>
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={styles.metaText}>Hiện chưa có yêu cầu nào ở luồng staff cần xử lý.</Text>
                )}
              </View>
            </View>
          </>
        )}

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
  successBox: {
    marginHorizontal: 20,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 12,
    padding: 12
  },
  successText: { fontSize: 13, color: "#1d4ed8", fontWeight: "600" },
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

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#f0f4ff"
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: "#eff6ff"
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 16
  },
  pageBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9"
  },
  pageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569"
  },
  chipText: { color: "#64748b", fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: colors.primary },

  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  metaText: { fontSize: 12, color: "#64748b", lineHeight: 18 },
  hintText: { fontSize: 12, color: "#94a3b8" },
  warningText: { fontSize: 12, color: "#ca8a04", lineHeight: 18 },

  workspaceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },

  backIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center"
  },

  requestDesc: { fontSize: 14, fontWeight: "700", color: "#0f172a", lineHeight: 20 },

  detailCard: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 6
  },
  subTitle: { color: "#0f172a", fontWeight: "800", fontSize: 14 },

  actionGroup: { gap: 8 },
  panelStack: { gap: 12 },
  optionStack: { gap: 10 },

  optionCard: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 6
  },
  optionCardMuted: { backgroundColor: "#f8fafc" },
  optionCardActive: { borderColor: colors.primary, backgroundColor: "#eff6ff" },

  selectedCard: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    padding: 12,
    gap: 8,
    backgroundColor: "#eff6ff"
  },
  selectedTitle: { color: "#0f172a", fontWeight: "800", fontSize: 14, lineHeight: 20 },

  agentGroup: { gap: 8 },
  agentCardWrapper: { width: 220, marginRight: 12 },
  optionCardHorizontal: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 4,
    height: 110,
    justifyContent: "space-between"
  },
  horizontalAgentScroll: { paddingRight: 20 },
  agentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  agentNameText: { flex: 1, minWidth: 0 },
  agentStatusPill: { flexShrink: 0, marginLeft: 6, paddingHorizontal: 6, paddingVertical: 4, alignSelf: "flex-start" },
  agentStatusText: { fontSize: 9 },
  actionPanel: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    padding: 14,
    gap: 10,
    backgroundColor: "#f0f4ff"
  },
  actionTitle: { color: "#0f172a", fontWeight: "800", fontSize: 14 },

  queueList: { gap: 10 },
  queueCard: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 8
  },
  queueCardActive: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  queueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  queueTitle: { color: "#0f172a", fontWeight: "800", fontSize: 14, lineHeight: 20, flex: 1 }
});




