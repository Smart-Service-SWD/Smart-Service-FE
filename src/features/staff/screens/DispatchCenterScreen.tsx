import { useCallback, useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp
} from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
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
  formatShortId
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
import SectionCard from "../../../shared/ui/SectionCard";
import MetricTile from "../../../shared/ui/MetricTile";
import StatusBadge from "../../../shared/ui/StatusBadge";
import {
  assignProvider,
  createActivityLog,
  createAssignment,
  createMatchingResult,
  evaluateComplexity
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

const complexityLevels = [1, 2, 3, 4, 5] as const;

const workspaceTabLabels: Record<WorkspaceTab, string> = {
  overview: "Tổng quan",
  complexity: "Độ khó",
  service: "Dịch vụ",
  agent: "Thợ"
};

const isDispatchFlow = (request: ServiceRequestItem) =>
  request.status === "CREATED" ||
  request.status === "URGENT_DISPATCH" ||
  request.status === "PENDING_REVIEW";

const canAssignProvider = (request: ServiceRequestItem | null) =>
  request?.status === "PENDING_REVIEW";

const canEvaluateComplexity = (request: ServiceRequestItem | null) =>
  request?.status === "CREATED" || request?.status === "PENDING_REVIEW";

const getStatusTone = (status?: string | null) => {
  if (status === "URGENT_DISPATCH") {
    return "danger" as const;
  }

  if (status === "PENDING_REVIEW") {
    return "warning" as const;
  }

  if (status === "ASSIGNED" || status === "COMPLETED") {
    return "success" as const;
  }

  return "primary" as const;
};

const getNextWorkspaceTab = (request: ServiceRequestItem | null): WorkspaceTab => {
  if (!request) {
    return "overview";
  }

  if (canEvaluateComplexity(request)) {
    return "complexity";
  }

  if (canAssignProvider(request)) {
    return request.serviceDefinitionId ? "agent" : "service";
  }

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

  if (!agent.isActive || !capability) {
    return null;
  }

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
  const [matchingScore, setMatchingScore] = useState("85");
  const [isRecommended, setIsRecommended] = useState(true);
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

  const applyMatchSelection = (match: AgentMatchCandidate | null) => {
    setSelectedAgentId(match?.agent.id ?? "");
    setMatchingScore(match ? String(match.score) : "85");
    setIsRecommended(match?.recommended ?? false);
  };

  const dispatchRequests = useMemo(
    () =>
      requests
        .filter(isDispatchFlow)
        .sort((left, right) => {
          const leftPriority =
            left.status === "URGENT_DISPATCH" ? 0 : left.status === "CREATED" ? 1 : 2;
          const rightPriority =
            right.status === "URGENT_DISPATCH" ? 0 : right.status === "CREATED" ? 1 : 2;

          if (leftPriority !== rightPriority) {
            return leftPriority - rightPriority;
          }

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
    if (!selectedRequest || !selectedServiceId) {
      return [];
    }

    return agents
      .map((agent) => buildAgentMatch(agent, selectedRequest, selectedServiceId))
      .filter((item): item is AgentMatchCandidate => item !== null)
      .sort((left, right) => {
        if (left.recommended !== right.recommended) {
          return left.recommended ? -1 : 1;
        }

        if (left.supportsSelectedService !== right.supportsSelectedService) {
          return left.supportsSelectedService ? -1 : 1;
        }

        if (left.supportsComplexity !== right.supportsComplexity) {
          return left.supportsComplexity ? -1 : 1;
        }

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

  const getCustomerName = (customerId?: string | null) =>
    customerId ? customerNamesById[customerId] ?? formatShortId(customerId) : "-";

  const getAgentName = (agentId?: string | null) =>
    agentId
      ? agents.find((agent) => agent.id === agentId)?.fullName ?? formatShortId(agentId)
      : "Chưa gán";

  const getAiValueLabel = (
    value?: string | null,
    wasAnalyzedByAI?: boolean
  ) => {
    if (value?.trim()) {
      return value;
    }

    return wasAnalyzedByAI ? "AI chưa trả về" : "Chưa phân tích AI";
  };

  const loadInitialData = useCallback(async () => {
    if (!session) {
      return;
    }

    try {
      const [agentData, requestData, userData] = await Promise.all([
        graphqlRequest<ServiceAgentsResponse>(
          SERVICE_AGENTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<AllRequestsResponse>(
          ALL_REQUESTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<UsersResponse>(USERS_QUERY, undefined, session.accessToken)
      ]);

      setCustomerNamesById(
        Object.fromEntries(userData.getUsers.map((user) => [user.id, user.fullName]))
      );
      setAgents(agentData.getServiceAgents);
      setRequests(requestData.getServiceRequests);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    }
  }, [session]);

  const loadRequestContext = async (request: ServiceRequestItem) => {
    if (!session) {
      return;
    }
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

  const handleSelectRequest = (request: ServiceRequestItem) => {
    setNeedsManualRequestSelection(false);
    setSelectedRequestId(request.id);
    setComplexityLevel(request.complexity?.level ?? 3);
    setSelectedAgentId("");
    setSuccess("");
    setError("");
    setActiveTab(getNextWorkspaceTab(request));
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

  const handleEvaluateComplexity = async () => {
    if (!session || !selectedRequest) {
      setError("Hãy chọn yêu cầu cần xử lý");
      return;
    }
    if (!canEvaluateComplexity(selectedRequest)) {
      setError(
        selectedRequest.status === "URGENT_DISPATCH"
          ? "Yêu cầu khẩn hiện chưa hỗ trợ đánh giá độ phức tạp trực tiếp trên màn này."
          : "Chỉ yêu cầu ở trạng thái Mới tạo hoặc Chờ duyệt mới có thể đánh giá độ phức tạp."
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const isReevaluation = selectedRequest.status === "PENDING_REVIEW";
      await evaluateComplexity(session.accessToken, selectedRequest.id, complexityLevel);
      await createActivityLog(session.accessToken, {
        serviceRequestId: selectedRequest.id,
        action: `Staff evaluated complexity ${complexityLevel} before dispatch`
      });
      setSuccess(
        isReevaluation
          ? "Đã cập nhật lại độ phức tạp. Tiếp theo bạn có thể kiểm tra service và chọn thợ ngay trong workspace này."
          : "Đã đánh giá độ phức tạp. Tiếp theo hãy kiểm tra service và chọn thợ phù hợp."
      );
      setActiveTab("service");
      await loadInitialData();
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatchingResult = async () => {
    if (!session || !selectedRequest) {
      setError("Hãy chọn yêu cầu cần điều phối");
      return;
    }
    if (!canAssignProvider(selectedRequest)) {
      setError("Hãy đánh giá độ phức tạp trước khi kiểm tra độ khớp và gán thợ.");
      return;
    }
    if (!selectedServiceId.trim()) {
      setError("Hãy chọn một service đang hoạt động trước khi kiểm tra độ khớp.");
      return;
    }
    if (!selectedAgentId.trim()) {
      setError("Hãy chọn một thợ phù hợp");
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

    const score = Number.parseFloat(matchingScore);
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setError("Điểm matching phải từ 0 đến 100");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const matchId = await createMatchingResult(session.accessToken, {
        serviceRequestId: selectedRequest.id,
        serviceAgentId: selectedAgentId,
        supportedComplexity: {
          level: selectedRequestLevel
        },
        matchingScore: score,
        isRecommended
      });

      await createActivityLog(session.accessToken, {
        serviceRequestId: selectedRequest.id,
        action: `Staff created matching result ${matchId} for agent ${selectedAgentId}`
      });

      setSuccess("Đã lưu kết quả khớp. Bạn có thể phân công ngay nếu mọi thông tin đã ổn.");
    } catch (actionError) {
      setError(asErrorMessage(actionError));
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

    const amount = Number.parseFloat(estimatedAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setError("Chi phí ước tính phải là số không âm");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const money = {
        amount,
        currency: currency.trim() || "VND"
      };

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
      setSelectedRequestId("");
      setSelectedAgentId("");
      setSelectedServiceId("");
      setEstimatedAmount("");
      setActiveTab("overview");
      await loadInitialData();
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  const renderActionPanel = () => (
    <View style={styles.actionPanel}>
      <Text style={styles.actionTitle}>Thao tác trực tiếp</Text>
      <Text style={styles.meta}>
        Đơn: {selectedRequest?.description || "-"} • Service: {selectedService?.name || "-"} •
        Thợ: {selectedAgentMatch?.agent.fullName || "-"}
      </Text>
      {selectedAgentMatch && !selectedAgentMatch.supportsComplexity ? (
        <Text style={styles.warningText}>
          Thợ đang chọn chưa đủ mức độ phức tạp cho đơn này, nên chưa thể lưu matching hoặc phân công.
        </Text>
      ) : null}
      {selectedAgentMatch && !selectedAgentMatch.supportsSelectedService ? (
        <Text style={styles.warningText}>
          Thợ đang chọn chưa được gắn cho dịch vụ hiện tại. Hãy đổi dịch vụ hoặc chọn thợ khác trước khi phân công.
        </Text>
      ) : null}
      <LabeledInput
        label="Điểm matching (0-100)"
        value={matchingScore}
        onChangeText={setMatchingScore}
        keyboardType="numeric"
        hint="Hệ thống gợi ý sẵn, staff có thể chỉnh ngay tại đây."
      />
      <ActionButton
        label={isRecommended ? "Đề xuất: Có" : "Đề xuất: Không"}
        onPress={() => setIsRecommended((current) => !current)}
        variant="secondary"
      />
      <LabeledInput
        label="Chi phí ước tính"
        value={estimatedAmount}
        onChangeText={setEstimatedAmount}
        keyboardType="numeric"
        hint="Mặc định theo service đang chọn, có thể sửa trước khi phân công."
      />
      <LabeledInput label="Đơn vị tiền tệ" value={currency} onChangeText={setCurrency} />
      <View style={styles.actions}>
        <ActionButton
          label={loading ? "Đang tạo..." : "Kiểm tra độ khớp"}
          onPress={() => void handleCreateMatchingResult()}
          disabled={
            loading ||
            !selectedRequest ||
            !selectedServiceId ||
            !selectedAgentId ||
            !selectedAgentMatch?.supportsComplexity ||
            !selectedAgentMatch?.supportsSelectedService ||
            !canAssignProvider(selectedRequest)
          }
          variant="secondary"
        />
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
      </View>
      {!canAssignProvider(selectedRequest) && selectedRequest ? (
        <Text style={styles.warningText}>
          Staff chỉ có thể gán thợ khi yêu cầu đã ở trạng thái Chờ duyệt.
        </Text>
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
    if (!routeRequestId) {
      return;
    }

    setNeedsManualRequestSelection(false);
    setSelectedRequestId(routeRequestId);
  }, [route.params?.requestId]);

  useEffect(() => {
    const nextSelected = dispatchRequests.find((item) => item.id === selectedRequestId);
    if (nextSelected) {
      return;
    }

    if (selectedRequestId) {
      setSelectedRequestId("");
      return;
    }

    if (!needsManualRequestSelection && dispatchRequests.length > 0) {
      setSelectedRequestId(dispatchRequests[0].id);
      return;
    }

    setSelectedRequestId("");
  }, [dispatchRequests, needsManualRequestSelection, selectedRequestId]);

  useEffect(() => {
    if (!selectedRequest) {
      setServices([]);
      setSelectedServiceId("");
      setSelectedAgentId("");
      setActiveTab("overview");
      return;
    }

    setComplexityLevel(selectedRequest.complexity?.level ?? 3);
    void loadRequestContext(selectedRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest, session?.accessToken]);

  useEffect(() => {
    if (!selectedAgentMatch && agentMatches.length > 0) {
      applyMatchSelection(readyAgentMatches[0] ?? agentMatches[0] ?? null);
      return;
    }

    if (!selectedAgentId) {
      return;
    }

    const stillEligible = agentMatches.some((item) => item.agent.id === selectedAgentId);
    if (!stillEligible) {
      applyMatchSelection(readyAgentMatches[0] ?? agentMatches[0] ?? null);
    }
  }, [agentMatches, readyAgentMatches, selectedAgentId, selectedAgentMatch]);

  return (
    <ScreenLayout
      title="Điều phối và gán thợ"
      subtitle="Một workspace ngắn gọn để chọn đơn, kiểm tra ngữ cảnh và thao tác ngay"
    >
      <SectionCard tone="primary" title="Tổng quan điều phối">
        <View style={styles.metricGrid}>
          <MetricTile label="Đơn chờ xử lý" value={dispatchRequests.length} helper="Trong luồng staff" tone="warning" />
          <MetricTile label="Thợ hoạt động" value={activeAgents.length} helper="Có thể được gán" tone="primary" />
          <MetricTile label="Service khả dụng" value={services.length} helper="Theo đơn đang chọn" tone="success" />
        </View>
        <ActionButton
          label={loading ? "Đang làm mới..." : "Làm mới dữ liệu"}
          onPress={() => void loadInitialData()}
          disabled={loading}
          variant="secondary"
        />
      </SectionCard>

      {!!error ? (
        <SectionCard tone="danger">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      {!!success ? (
        <SectionCard tone="success">
          <Text style={styles.success}>{success}</Text>
        </SectionCard>
      ) : null}

      <SectionCard
        title={`Hàng chờ điều phối (${dispatchRequests.length})`}
        subtitle="Chọn một yêu cầu để mở workspace bên dưới"
      >
        <View style={styles.queueList}>
          {dispatchRequests.length > 0 ? (
            dispatchRequests.map((request) => (
              <Pressable
                key={request.id}
                style={[
                  styles.queueCard,
                  selectedRequestId === request.id && styles.queueCardActive
                ]}
                onPress={() => handleSelectRequest(request)}
              >
                <View style={styles.queueHeader}>
                  <Text style={styles.queueTitle}>{request.description}</Text>
                  <StatusBadge
                    label={formatRequestStatus(request.status)}
                    tone={getStatusTone(request.status)}
                  />
                </View>
                <View style={styles.badgeRow}>
                  <StatusBadge label={formatShortId(request.id)} tone="neutral" />
                  <StatusBadge label={formatDateTime(request.createdAt)} tone="primary" />
                </View>
                <Text style={styles.meta}>Khách hàng: {getCustomerName(request.customerId)}</Text>
                <Text style={styles.meta}>Thợ đã gán: {getAgentName(request.assignedProviderId)}</Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.meta}>Hiện chưa có yêu cầu nào ở luồng staff cần xử lý.</Text>
          )}
        </View>
      </SectionCard>

      {selectedRequest ? (
        <SectionCard
          title={`Workspace cho đơn ${formatShortId(selectedRequest.id)}`}
          subtitle={selectedRequest.description}
        >
          <View style={styles.badgeRow}>
            <StatusBadge label={formatRequestStatus(selectedRequest.status)} tone={getStatusTone(selectedRequest.status)} />
            <StatusBadge label={`Khách: ${getCustomerName(selectedRequest.customerId)}`} tone="neutral" />
            <StatusBadge label={`Thợ: ${getAgentName(selectedRequest.assignedProviderId)}`} tone="primary" />
          </View>

          <View style={styles.tabRow}>
            {(Object.keys(workspaceTabLabels) as WorkspaceTab[]).map((tab) => {
              const active = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {workspaceTabLabels[tab]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeTab === "overview" ? (
            <View style={styles.panelStack}>
              <Text style={styles.meta}>
                Địa chỉ: {selectedRequest.addressText || "Khách hàng chưa nhập địa chỉ cho yêu cầu này."}
              </Text>
              {selectedRequest.serviceDefinitionId ? (
                <Text style={styles.meta}>
                  Dịch vụ khách chọn: {services.find((item) => item.id === selectedRequest.serviceDefinitionId)?.name ?? formatShortId(selectedRequest.serviceDefinitionId)}
                </Text>
              ) : null}
              <Text style={styles.meta}>AI báo giá: {getAiValueLabel(selectedRequest.estimatedPrice, selectedRequest.wasAnalyzedByAI)}</Text>
              <Text style={styles.meta}>AI dự kiến: {getAiValueLabel(selectedRequest.estimatedDuration, selectedRequest.wasAnalyzedByAI)}</Text>
              {selectedRequest.ocrExtractedText ? (
                <Text style={styles.meta}>Nội dung từ ảnh: {selectedRequest.ocrExtractedText}</Text>
              ) : null}
              <View style={styles.actions}>
                {canEvaluateComplexity(selectedRequest) ? (
                  <ActionButton
                    label="Đánh giá độ khó"
                    onPress={() => setActiveTab("complexity")}
                    variant="secondary"
                  />
                ) : null}
                <ActionButton
                  label="Chọn service và thợ"
                  onPress={() => setActiveTab(selectedServiceId ? "agent" : "service")}
                  variant="secondary"
                />
                {selectedRequest.assignedProviderId ? (
                  <ActionButton
                    label="Xem lịch sử phân công"
                    onPress={() => navigation.navigate("DispatchHistory", { requestId: selectedRequest.id })}
                    variant="secondary"
                  />
                ) : null}
              </View>
            </View>
          ) : null}

          {activeTab === "complexity" ? (
            <View style={styles.panelStack}>
              <Text style={styles.meta}>
                {selectedRequest.status === "PENDING_REVIEW"
                  ? "Bạn có thể đánh giá lại độ phức tạp trước khi phân công."
                  : selectedRequest.status === "CREATED"
                    ? "Hãy đánh giá độ phức tạp trước khi phân công thợ."
                    : "Yêu cầu khẩn hiện chưa có bước đánh giá riêng trên màn này."}
              </Text>
              <View style={styles.levelRow}>
                {complexityLevels.map((level) => {
                  const active = level === complexityLevel;
                  return (
                    <Pressable
                      key={level}
                      style={[styles.levelChip, active && styles.levelChipActive]}
                      onPress={() => setComplexityLevel(level)}
                    >
                      <Text style={[styles.levelText, active && styles.levelTextActive]}>
                        Mức {level}
                      </Text>
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
                <ActionButton
                  label="Tiếp tục qua service"
                  onPress={() => setActiveTab("service")}
                  variant="secondary"
                />
              ) : null}
            </View>
          ) : null}

          {activeTab === "service" ? (
            <View style={styles.panelStack}>
              {!canAssignProvider(selectedRequest) ? (
                <>
                  <Text style={styles.warningText}>
                    Staff cần đánh giá độ phức tạp trước khi chọn service.
                  </Text>
                  <ActionButton
                    label="Quay lại đánh giá độ khó"
                    onPress={() => setActiveTab("complexity")}
                    variant="secondary"
                  />
                </>
              ) : services.length > 0 ? (
                <>
                  {selectedService ? (
                    <View style={styles.selectedSummaryCard}>
                      <Text style={styles.selectionTitle}>Đang áp dụng: {selectedService.name}</Text>
                      <View style={styles.badgeRow}>
                        <StatusBadge label={formatCurrency(selectedService.basePrice)} tone="primary" />
                        <StatusBadge label={`${selectedService.estimatedDuration} phút`} tone="neutral" />
                        {!selectedService.isActive ? <StatusBadge label="Tạm ngưng" tone="danger" /> : null}
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.optionStack}>
                    {services.map((service) => (
                      <Pressable
                        key={service.id}
                        style={[
                          styles.optionCard,
                          selectedServiceId === service.id && styles.optionCardActive
                        ]}
                        onPress={() => handleSelectService(service)}
                      >
                        <Text style={styles.selectionTitle}>{service.name}</Text>
                        <Text style={styles.meta}>{service.description || "Chưa có mô tả"}</Text>
                        <Text style={styles.meta}>Giá cơ sở: {formatCurrency(service.basePrice)}</Text>
                        <Text style={styles.meta}>Thời gian chuẩn: {service.estimatedDuration} phút</Text>
                      </Pressable>
                    ))}
                  </View>
                  <ActionButton
                    label="Tiếp tục qua chọn thợ"
                    onPress={() => setActiveTab("agent")}
                    variant="secondary"
                  />
                </>
              ) : (
                <Text style={styles.meta}>Danh mục này chưa có service đang hoạt động để staff chọn.</Text>
              )}
            </View>
          ) : null}

          {activeTab === "agent" ? (
            <View style={styles.panelStack}>
              {!canAssignProvider(selectedRequest) ? (
                <>
                  <Text style={styles.warningText}>
                    Staff cần đánh giá độ phức tạp trước khi chọn thợ.
                  </Text>
                  <ActionButton
                    label="Quay lại đánh giá độ khó"
                    onPress={() => setActiveTab("complexity")}
                    variant="secondary"
                  />
                </>
              ) : !selectedServiceId ? (
                <>
                  <Text style={styles.warningText}>
                    Hãy chọn service áp dụng cho đơn trước khi xem gợi ý thợ phù hợp.
                  </Text>
                  <ActionButton
                    label="Quay lại chọn service"
                    onPress={() => setActiveTab("service")}
                    variant="secondary"
                  />
                </>
              ) : agentMatches.length > 0 ? (
                <>
                  {readyAgentMatches.length > 0 ? (
                    <View style={styles.optionStack}>
                      <Text style={styles.subTitle}>Có thể gán ngay</Text>
                      {readyAgentMatches.map((match) => (
                        <View key={match.agent.id} style={styles.agentGroup}>
                          <Pressable
                            style={[
                              styles.optionCard,
                              selectedAgentId === match.agent.id && styles.optionCardActive
                            ]}
                            onPress={() => handleSelectAgent(match)}
                          >
                            <Text style={styles.selectionTitle}>{match.agent.fullName}</Text>
                            <Text style={styles.meta}>Mã thợ: {formatShortId(match.agent.id)}</Text>
                            <Text style={styles.meta}>
                              Mức tối đa: {match.capability?.maxComplexity?.level ?? "?"}
                            </Text>
                            <Text style={styles.meta}>
                              Điểm gợi ý: {match.score} · Đề xuất: {match.recommended ? "Có" : "Không"}
                            </Text>
                            <Text style={styles.meta}>{match.notes.join(" · ")}</Text>
                          </Pressable>
                          {selectedAgentId === match.agent.id ? renderActionPanel() : null}
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {reviewAgentMatches.length > 0 ? (
                    <View style={styles.optionStack}>
                      <Text style={styles.subTitle}>Cần rà soát thêm</Text>
                      <Text style={styles.meta}>
                        Các thợ dưới đây cùng danh mục nhưng chưa đủ mức độ phức tạp hoặc chưa gắn đúng dịch vụ.
                      </Text>
                      {reviewAgentMatches.map((match) => (
                        <View key={match.agent.id} style={styles.agentGroup}>
                          <Pressable
                            style={[
                              styles.optionCard,
                              styles.optionCardMuted,
                              selectedAgentId === match.agent.id && styles.optionCardActive
                            ]}
                            onPress={() => handleSelectAgent(match)}
                          >
                            <Text style={styles.selectionTitle}>{match.agent.fullName}</Text>
                            <Text style={styles.meta}>Mã thợ: {formatShortId(match.agent.id)}</Text>
                            <Text style={styles.meta}>
                              Mức tối đa: {match.capability?.maxComplexity?.level ?? "?"}
                            </Text>
                            <Text style={styles.meta}>
                              Điểm tham khảo: {match.score} · Gán ngay:{" "}
                              {match.supportsComplexity && match.supportsSelectedService ? "Có" : "Không"}
                            </Text>
                            <Text style={styles.meta}>{match.notes.join(" · ")}</Text>
                          </Pressable>
                          {selectedAgentId === match.agent.id ? renderActionPanel() : null}
                        </View>
                      ))}
                    </View>
                  ) : null}
                </>
              ) : (
                <>
                  <Text style={styles.meta}>
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
        </SectionCard>
      ) : null}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  queueList: {
    gap: 10
  },
  queueCard: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 13,
    gap: 8,
    backgroundColor: colors.surfaceRaised
  },
  queueCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoftAlt
  },
  queueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10
  },
  queueTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 20,
    flex: 1
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  tabChip: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surfaceRaised
  },
  tabChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  tabTextActive: {
    color: colors.primaryStrong
  },
  panelStack: {
    gap: 12
  },
  optionStack: {
    gap: 10
  },
  optionCard: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 13,
    gap: 6,
    backgroundColor: colors.surfaceRaised
  },
  optionCardMuted: {
    backgroundColor: colors.surfaceMuted
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoftAlt
  },
  selectedSummaryCard: {
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 20,
    padding: 13,
    gap: 8,
    backgroundColor: colors.primarySoftAlt
  },
  agentGroup: {
    gap: 8
  },
  actionPanel: {
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    backgroundColor: colors.surfaceMuted
  },
  actionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14
  },
  selectionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14,
    lineHeight: 20
  },
  subTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14
  },
  levelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  levelChip: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.surfaceRaised
  },
  levelChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  levelText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  levelTextActive: {
    color: colors.primaryStrong
  },
  actions: {
    gap: 10
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  warningText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  },
  success: {
    color: colors.success,
    fontSize: 13,
    lineHeight: 18
  }
});
