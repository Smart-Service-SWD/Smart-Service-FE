import { useEffect, useMemo, useState } from "react";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import type { StaffTabParamList } from "../../../app/navigation/types";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ACTIVITY_LOGS_BY_REQUEST_QUERY,
  ALL_REQUESTS_QUERY,
  ASSIGNMENTS_BY_REQUEST_QUERY,
  MATCHING_RESULTS_BY_REQUEST_QUERY,
  SERVICE_AGENTS_QUERY,
  SERVICE_DEFINITIONS_BY_CATEGORY_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatCurrency,
  formatDateTime,
  formatRequestStatus,
  formatShortId
} from "../../../shared/utils/format";
import type {
  ActivityLogItem,
  AgentCapabilityItem,
  AssignmentItem,
  MatchingResultItem,
  ServiceAgentItem,
  ServiceDefinition,
  ServiceRequestItem
} from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import {
  assignProvider,
  createActivityLog,
  createAssignment,
  createMatchingResult,
  evaluateComplexity
} from "../api/staffApi";

interface MatchingByRequestResponse {
  getMatchingResultsByServiceRequestId: MatchingResultItem[];
}

interface AssignmentResponse {
  getAssignmentsByServiceRequestId: AssignmentItem[];
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface ServicesByCategoryResponse {
  getServiceDefinitionsByCategory: ServiceDefinition[];
}

interface ActivityByRequestResponse {
  getActivityLogsByServiceRequestId: ActivityLogItem[];
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

const complexityLevels = [1, 2, 3, 4, 5] as const;

const isDispatchFlow = (request: ServiceRequestItem) =>
  request.status === "CREATED" ||
  request.status === "URGENT_DISPATCH" ||
  request.status === "PENDING_REVIEW";

const canAssignProvider = (request: ServiceRequestItem | null) =>
  request?.status === "PENDING_REVIEW";

const canEvaluateComplexity = (request: ServiceRequestItem | null) =>
  request?.status === "CREATED" || request?.status === "PENDING_REVIEW";

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
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [matches, setMatches] = useState<MatchingResultItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [requestLogs, setRequestLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [needsManualRequestSelection, setNeedsManualRequestSelection] = useState(false);

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
    () =>
      agentMatches.filter(
        (item) => item.supportsComplexity && item.supportsSelectedService
      ),
    [agentMatches]
  );

  const reviewAgentMatches = useMemo(
    () =>
      agentMatches.filter(
        (item) => !item.supportsComplexity || !item.supportsSelectedService
      ),
    [agentMatches]
  );

  const selectedAgentMatch = useMemo(
    () => agentMatches.find((item) => item.agent.id === selectedAgentId) ?? null,
    [agentMatches, selectedAgentId]
  );

  const activeAgents = useMemo(
    () => agents.filter((agent) => agent.isActive),
    [agents]
  );

  const activeAgentsWithCapabilities = useMemo(
    () =>
      activeAgents.filter((agent) => (agent.capabilities?.length ?? 0) > 0),
    [activeAgents]
  );

  const getAgentName = (agentId?: string | null) =>
    agents.find((agent) => agent.id === agentId)?.fullName ?? formatShortId(agentId);

  const loadInitialData = async () => {
    if (!session) {
      return;
    }

    try {
      const [agentData, requestData] = await Promise.all([
        graphqlRequest<ServiceAgentsResponse>(
          SERVICE_AGENTS_QUERY,
          undefined,
          session.accessToken
        ),
        graphqlRequest<AllRequestsResponse>(
          ALL_REQUESTS_QUERY,
          undefined,
          session.accessToken
        )
      ]);

      setAgents(agentData.getServiceAgents);
      setRequests(requestData.getServiceRequests);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    }
  };

  const loadRequestContext = async (request: ServiceRequestItem) => {
    if (!session) {
      return;
    }
    if (!request.categoryId) {
      setServices([]);
      setMatches([]);
      setAssignments([]);
      setRequestLogs([]);
      setSelectedServiceId("");
      setEstimatedAmount("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [matchingData, assignmentData, activityData, serviceData] = await Promise.all([
        graphqlRequest<MatchingByRequestResponse, { serviceRequestId: string }>(
          MATCHING_RESULTS_BY_REQUEST_QUERY,
          { serviceRequestId: request.id },
          session.accessToken
        ),
        graphqlRequest<AssignmentResponse, { serviceRequestId: string }>(
          ASSIGNMENTS_BY_REQUEST_QUERY,
          { serviceRequestId: request.id },
          session.accessToken
        ),
        graphqlRequest<ActivityByRequestResponse, { serviceRequestId: string }>(
          ACTIVITY_LOGS_BY_REQUEST_QUERY,
          { serviceRequestId: request.id },
          session.accessToken
        ),
        graphqlRequest<ServicesByCategoryResponse, { categoryId: string }>(
          SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
          { categoryId: request.categoryId },
          session.accessToken
        )
      ]);

      setMatches(matchingData.getMatchingResultsByServiceRequestId);
      setAssignments(assignmentData.getAssignmentsByServiceRequestId);
      setRequestLogs(activityData.getActivityLogsByServiceRequestId);
      const availableServices = serviceData.getServiceDefinitionsByCategory.filter(
        (service) => service.isActive || service.id === request.serviceDefinitionId
      );
      setServices(availableServices);

      const nextService =
        availableServices.find(
          (item) => item.id === request.serviceDefinitionId
        ) ??
        availableServices.find(
          (item) => item.id === selectedServiceId
        ) ?? availableServices[0];

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
  };

  const handleSelectService = (service: ServiceDefinition) => {
    setSelectedServiceId(service.id);
    setEstimatedAmount(String(service.basePrice));
    setSelectedAgentId("");
    setSuccess("");
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
          ? "Đã cập nhật lại độ phức tạp. Dịch vụ của đơn vẫn được giữ sẵn để staff tiếp tục gán thợ."
          : "Đã đánh giá độ phức tạp. Dịch vụ của đơn sẽ được tự chọn sẵn ở bước tiếp theo."
      );
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

      setSuccess("Đã tạo kết quả khớp để staff kiểm tra độ phù hợp.");
      await loadRequestContext(selectedRequest);
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

      setSuccess("Đã phân công xong đơn này. Hãy chọn yêu cầu tiếp theo nếu cần.");
      setNeedsManualRequestSelection(true);
      setSelectedRequestId("");
      setSelectedAgentId("");
      await loadInitialData();
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

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
      setMatches([]);
      setAssignments([]);
      setRequestLogs([]);
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
      title="Điều phối & gán thợ"
      subtitle="Một màn duy nhất để đánh giá độ phức tạp, kiểm tra độ khớp và phân công"
    >
      <View style={styles.helperCard}>
        <Text style={styles.helperTitle}>Luồng staff trên màn này</Text>
        <Text style={styles.helperText}>1. Chọn yêu cầu mới hoặc yêu cầu khẩn.</Text>
        <Text style={styles.helperText}>
          2. Nếu request đang ở trạng thái Mới tạo, staff đánh giá độ phức tạp ngay tại đây.
        </Text>
        <Text style={styles.helperText}>
          3. Khi request đã sang Chờ duyệt, hệ thống sẽ giữ sẵn dịch vụ của đơn và gợi ý thợ để staff phân công.
        </Text>
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}
      {loading ? <Text style={styles.meta}>Đang tải ngữ cảnh điều phối...</Text> : null}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>
          Đơn có thể xử lý: {dispatchRequests.length} • Matching đã lưu: {matches.length} •
          Assignment đã tạo: {assignments.length}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Bước 1 · Chọn yêu cầu cần xử lý</Text>
        {dispatchRequests.length > 0 ? (
          dispatchRequests.map((request) => (
            <Pressable
              key={request.id}
              style={[
                styles.selectionCard,
                selectedRequestId === request.id && styles.selectionCardActive
              ]}
              onPress={() => handleSelectRequest(request)}
            >
              <Text style={styles.selectionTitle}>{request.description}</Text>
              <Text style={styles.meta}>Mã: {formatShortId(request.id)}</Text>
              <Text style={styles.meta}>
                Trạng thái: {formatRequestStatus(request.status)}
              </Text>
              <Text style={styles.meta}>Tạo lúc: {formatDateTime(request.createdAt)}</Text>
              <Text style={styles.meta}>
                Độ phức tạp hiện tại: {request.complexity?.level ?? "Chưa có"}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.meta}>Hiện chưa có yêu cầu nào ở luồng staff cần xử lý.</Text>
        )}
      </View>

      {selectedRequest ? (
        <View style={styles.card}>
          <Text style={styles.title}>Bước 2 · Xem ngữ cảnh đơn</Text>
          <Text style={styles.selectionTitle}>{selectedRequest.description}</Text>
          <Text style={styles.meta}>Mã: {formatShortId(selectedRequest.id)}</Text>
          <Text style={styles.meta}>
            Trạng thái: {formatRequestStatus(selectedRequest.status)}
          </Text>
          {selectedRequest.serviceDefinitionId ? (
            <Text style={styles.meta}>
              Dịch vụ khách chọn:{" "}
              {services.find((item) => item.id === selectedRequest.serviceDefinitionId)?.name ??
                formatShortId(selectedRequest.serviceDefinitionId)}
            </Text>
          ) : null}
          {selectedRequest.estimatedPrice ? (
            <Text style={styles.meta}>AI báo giá: {selectedRequest.estimatedPrice}</Text>
          ) : null}
          {selectedRequest.estimatedDuration ? (
            <Text style={styles.meta}>AI dự kiến: {selectedRequest.estimatedDuration}</Text>
          ) : null}
          {selectedRequest.ocrExtractedText ? (
            <Text style={styles.meta}>Nội dung từ ảnh: {selectedRequest.ocrExtractedText}</Text>
          ) : null}
          <View style={styles.logBox}>
            <Text style={styles.subTitle}>Nhật ký gần nhất</Text>
            {requestLogs.slice(0, 4).map((log) => (
              <Text key={log.id} style={styles.meta}>
                • {formatDateTime(log.createdAt)} · {log.action}
              </Text>
            ))}
            {requestLogs.length === 0 ? (
              <Text style={styles.meta}>Chưa có nhật ký nào cho yêu cầu này.</Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {selectedRequest ? (
        <View style={styles.card}>
          <Text style={styles.title}>Bước 3 · Đánh giá độ phức tạp</Text>
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
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Bước 4 · Dịch vụ áp dụng cho đơn</Text>
        {selectedRequest?.serviceDefinitionId ? (
          <Text style={styles.meta}>
            Đơn này đã có dịch vụ khách chọn. Staff chỉ cần đổi khi thật sự muốn chuyển sang dịch vụ khác cùng danh mục.
          </Text>
        ) : selectedRequest ? (
          <Text style={styles.meta}>
            Đơn chưa có dịch vụ cụ thể, staff chọn một dịch vụ để hệ thống gợi ý giá và gợi ý thợ.
          </Text>
        ) : null}
        {selectedService ? (
          <View style={styles.selectedSummaryCard}>
            <Text style={styles.selectionTitle}>Đang áp dụng: {selectedService.name}</Text>
            <Text style={styles.meta}>
              Giá cơ sở: {formatCurrency(selectedService.basePrice)} • Thời gian chuẩn:{" "}
              {selectedService.estimatedDuration} phút
            </Text>
            {!selectedService.isActive ? (
              <Text style={styles.warningText}>
                Dịch vụ này đang ngưng nhận mới nhưng vẫn được giữ lại vì đã gắn với yêu cầu hiện tại.
              </Text>
            ) : null}
          </View>
        ) : null}
        {selectedRequest ? (
          canAssignProvider(selectedRequest) ? (
            services.length > 0 ? (
              services.map((service) => (
                <Pressable
                  key={service.id}
                  style={[
                    styles.selectionCard,
                    selectedServiceId === service.id && styles.selectionCardActive
                  ]}
                  onPress={() => handleSelectService(service)}
                >
                  <Text style={styles.selectionTitle}>{service.name}</Text>
                  <Text style={styles.meta}>{service.description || "Chưa có mô tả"}</Text>
                  <Text style={styles.meta}>
                    Giá cơ sở: {formatCurrency(service.basePrice)}
                  </Text>
                  <Text style={styles.meta}>
                    Thời gian chuẩn: {service.estimatedDuration} phút
                  </Text>
                  {!service.isActive ? (
                    <Text style={styles.warningText}>Đang ngưng nhận mới</Text>
                  ) : null}
                </Pressable>
              ))
            ) : (
              <Text style={styles.meta}>
                Danh mục này chưa có service đang hoạt động để staff chọn.
              </Text>
            )
          ) : (
            <Text style={styles.meta}>Staff cần đánh giá độ phức tạp trước khi chọn service.</Text>
          )
        ) : (
          <Text style={styles.meta}>Hãy chọn yêu cầu trước.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Bước 5 · Chọn thợ phù hợp</Text>
        {selectedRequest ? (
          canAssignProvider(selectedRequest) ? (
            !selectedServiceId ? (
              <Text style={styles.meta}>
                Hãy chọn dịch vụ áp dụng cho đơn trước khi xem gợi ý thợ phù hợp.
              </Text>
            ) : agentMatches.length > 0 ? (
              <>
                {readyAgentMatches.length > 0 ? (
                  <>
                    <Text style={styles.subTitle}>Gán được ngay</Text>
                    {readyAgentMatches.map((match) => (
                      <Pressable
                        key={match.agent.id}
                        style={[
                          styles.selectionCard,
                          selectedAgentId === match.agent.id && styles.selectionCardActive
                        ]}
                        onPress={() => handleSelectAgent(match)}
                      >
                        <Text style={styles.selectionTitle}>{match.agent.fullName}</Text>
                        <Text style={styles.meta}>Mã thợ: {formatShortId(match.agent.id)}</Text>
                        <Text style={styles.meta}>
                          Mức phức tạp tối đa: {match.capability?.maxComplexity?.level ?? "?"}
                        </Text>
                        <Text style={styles.meta}>
                          Điểm gợi ý: {match.score} · Đề xuất: {match.recommended ? "Có" : "Không"}
                        </Text>
                        <Text style={styles.meta}>{match.notes.join(" · ")}</Text>
                      </Pressable>
                    ))}
                  </>
                ) : null}

                {reviewAgentMatches.length > 0 ? (
                  <>
                    <Text style={styles.subTitle}>Cần staff rà soát thêm</Text>
                    <Text style={styles.meta}>
                      Các thợ dưới đây cùng danh mục nhưng chưa đủ mức độ phức tạp hoặc chưa gắn đúng dịch vụ.
                    </Text>
                    {reviewAgentMatches.map((match) => (
                      <Pressable
                        key={match.agent.id}
                        style={[
                          styles.selectionCard,
                          styles.selectionCardMuted,
                          selectedAgentId === match.agent.id && styles.selectionCardActive
                        ]}
                        onPress={() => handleSelectAgent(match)}
                      >
                        <Text style={styles.selectionTitle}>{match.agent.fullName}</Text>
                        <Text style={styles.meta}>Mã thợ: {formatShortId(match.agent.id)}</Text>
                        <Text style={styles.meta}>
                          Mức phức tạp tối đa: {match.capability?.maxComplexity?.level ?? "?"}
                        </Text>
                        <Text style={styles.meta}>
                          Điểm tham khảo: {match.score} · Gán ngay:{" "}
                          {match.supportsComplexity && match.supportsSelectedService ? "Có" : "Không"}
                        </Text>
                        <Text style={styles.meta}>{match.notes.join(" · ")}</Text>
                      </Pressable>
                    ))}
                  </>
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
                    Đây thường là dấu hiệu BE chưa trả kèm capabilities cho query thợ. Hãy restart BE mới nhất rồi tải lại màn hình.
                  </Text>
                ) : null}
              </>
            )
          ) : (
            <Text style={styles.meta}>Staff cần đánh giá độ phức tạp trước khi chọn thợ.</Text>
          )
        ) : (
          <Text style={styles.meta}>Hãy chọn yêu cầu trước.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Bước 6 · Kiểm tra độ khớp và phân công</Text>
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
          hint="Hệ thống gợi ý từ năng lực thợ; staff có thể chỉnh trước khi lưu."
        />
        <View style={styles.rowAction}>
          <ActionButton
            label={isRecommended ? "Đề xuất: Có" : "Đề xuất: Không"}
            onPress={() => setIsRecommended((current) => !current)}
            variant="secondary"
          />
        </View>
        <LabeledInput
          label="Chi phí ước tính"
          value={estimatedAmount}
          onChangeText={setEstimatedAmount}
          keyboardType="numeric"
          hint="Tự điền từ service đang chọn; staff có thể sửa."
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

      <View style={styles.card}>
        <Text style={styles.title}>Matching đã lưu ({matches.length})</Text>
        {matches.map((match) => (
          <View key={match.id} style={styles.selectionCard}>
            <Text style={styles.selectionTitle}>Thợ: {getAgentName(match.serviceAgentId)}</Text>
            <Text style={styles.meta}>Điểm: {match.matchingScore}</Text>
            <Text style={styles.meta}>
              Độ phức tạp hỗ trợ: {match.supportedComplexity?.level ?? "N/A"}
            </Text>
          </View>
        ))}
        {matches.length === 0 ? (
          <Text style={styles.meta}>Chưa có matching result cho yêu cầu đang chọn.</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Assignment đã tạo ({assignments.length})</Text>
        {assignments.map((assignment) => (
          <View key={assignment.id} style={styles.selectionCard}>
            <Text style={styles.selectionTitle}>Thợ: {getAgentName(assignment.agentId)}</Text>
            <Text style={styles.meta}>
              Phân công lúc: {formatDateTime(assignment.assignedAt)}
            </Text>
            <Text style={styles.meta}>
              Ước tính:{" "}
              {formatCurrency(
                assignment.estimatedCost.amount,
                assignment.estimatedCost.currency
              )}
            </Text>
          </View>
        ))}
        {assignments.length === 0 ? (
          <Text style={styles.meta}>Chưa có assignment cho yêu cầu đang chọn.</Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        <ActionButton
          label="Quay lại danh sách yêu cầu"
          onPress={() => navigation.navigate("ReviewQueue")}
          variant="secondary"
        />
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  helperCard: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    gap: 4
  },
  helperTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  summaryText: {
    color: colors.textMuted,
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    gap: 10
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  subTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  selectionCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    backgroundColor: "#fff"
  },
  selectionCardMuted: {
    backgroundColor: colors.surface
  },
  selectionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  selectedSummaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    backgroundColor: colors.primarySoft
  },
  selectionTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  logBox: {
    gap: 4,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  rowAction: {
    marginTop: 2
  },
  levelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  levelChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff"
  },
  levelChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  levelText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  levelTextActive: {
    color: colors.primary
  },
  warningText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18
  },
  actions: {
    gap: 10
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  success: {
    color: colors.success,
    fontSize: 13
  }
});
