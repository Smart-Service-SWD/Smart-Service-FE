import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ASSIGNMENTS_BY_REQUEST_QUERY,
  MATCHING_RESULTS_BY_REQUEST_QUERY,
  RECOMMENDED_MATCHES_QUERY,
  SERVICE_AGENTS_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatCurrency, formatDateTime } from "../../../shared/utils/format";
import type {
  AssignmentItem,
  MatchingResultItem,
  ServiceAgentItem
} from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import {
  assignProvider,
  createActivityLog,
  createAssignment,
  createMatchingResult
} from "../api/staffApi";

interface MatchingByRequestResponse {
  getMatchingResultsByServiceRequestId: MatchingResultItem[];
}

interface RecommendedResponse {
  getRecommendedMatches: MatchingResultItem[];
}

interface AssignmentResponse {
  getAssignmentsByServiceRequestId: AssignmentItem[];
}

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

export default function DispatchCenterScreen() {
  const { session } = useAuth();
  const [requestId, setRequestId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [complexityLevel, setComplexityLevel] = useState("3");
  const [matchingScore, setMatchingScore] = useState("80");
  const [isRecommended, setIsRecommended] = useState(true);
  const [estimatedAmount, setEstimatedAmount] = useState("500000");
  const [currency, setCurrency] = useState("VND");
  const [agents, setAgents] = useState<ServiceAgentItem[]>([]);
  const [matches, setMatches] = useState<MatchingResultItem[]>([]);
  const [recommendedMatches, setRecommendedMatches] = useState<MatchingResultItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadAgents = async () => {
    if (!session) {
      return;
    }
    try {
      const data = await graphqlRequest<ServiceAgentsResponse>(
        SERVICE_AGENTS_QUERY,
        undefined,
        session.accessToken
      );
      setAgents(data.getServiceAgents);
      const firstActive = data.getServiceAgents.find((agent) => agent.isActive);
      if (firstActive && !agentId) {
        setAgentId(firstActive.id);
      }
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    }
  };

  const loadDispatchContext = async () => {
    if (!session) {
      return;
    }
    if (!requestId.trim()) {
      setError("Service request ID is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [matchingData, recommendedData, assignmentData] = await Promise.all([
        graphqlRequest<MatchingByRequestResponse, { serviceRequestId: string }>(
          MATCHING_RESULTS_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        ),
        graphqlRequest<RecommendedResponse, { serviceRequestId: string }>(
          RECOMMENDED_MATCHES_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        ),
        graphqlRequest<AssignmentResponse, { serviceRequestId: string }>(
          ASSIGNMENTS_BY_REQUEST_QUERY,
          { serviceRequestId: requestId.trim() },
          session.accessToken
        )
      ]);
      setMatches(matchingData.getMatchingResultsByServiceRequestId);
      setRecommendedMatches(recommendedData.getRecommendedMatches);
      setAssignments(assignmentData.getAssignmentsByServiceRequestId);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatchingResult = async () => {
    if (!session) {
      return;
    }
    if (!requestId.trim() || !agentId.trim()) {
      setError("Request ID and agent ID are required");
      return;
    }

    const level = Number.parseInt(complexityLevel, 10);
    const score = Number.parseFloat(matchingScore);
    if (Number.isNaN(level) || level < 1 || level > 5) {
      setError("Complexity level must be between 1 and 5");
      return;
    }
    if (Number.isNaN(score) || score < 0 || score > 100) {
      setError("Matching score must be between 0 and 100");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const matchId = await createMatchingResult(session.accessToken, {
        serviceRequestId: requestId.trim(),
        serviceAgentId: agentId.trim(),
        supportedComplexity: { level },
        matchingScore: score,
        isRecommended
      });
      await createActivityLog(session.accessToken, {
        serviceRequestId: requestId.trim(),
        action: `Created matching result ${matchId} for agent ${agentId.trim()}`
      });
      setSuccess(`Matching result created: ${matchId}`);
      await loadDispatchContext();
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignProviderAndCreateAssignment = async () => {
    if (!session) {
      return;
    }
    if (!requestId.trim() || !agentId.trim()) {
      setError("Request ID and agent ID are required");
      return;
    }

    const amount = Number.parseFloat(estimatedAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setError("Estimated cost must be a non-negative number");
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
      await assignProvider(session.accessToken, requestId.trim(), {
        providerId: agentId.trim(),
        estimatedCost: money
      });

      const assignmentId = await createAssignment(session.accessToken, {
        serviceRequestId: requestId.trim(),
        agentId: agentId.trim(),
        estimatedCost: money
      });

      await createActivityLog(session.accessToken, {
        serviceRequestId: requestId.trim(),
        action: `Assigned provider ${agentId.trim()} with assignment ${assignmentId}`
      });

      setSuccess(`Provider assigned and assignment created: ${assignmentId}`);
      await loadDispatchContext();
    } catch (actionError) {
      setError(asErrorMessage(actionError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <ScreenLayout title="Dispatch Center" subtitle="Staff dispatch + assignment flow">
      <View style={styles.card}>
        <Text style={styles.title}>Dispatch Input</Text>
        <LabeledInput
          label="Service Request ID"
          value={requestId}
          onChangeText={setRequestId}
          placeholder="Paste request ID"
          autoCapitalize="none"
        />
        <LabeledInput
          label="Agent ID"
          value={agentId}
          onChangeText={setAgentId}
          placeholder="Paste service agent ID"
          autoCapitalize="none"
        />
        <LabeledInput
          label="Supported Complexity (1-5)"
          value={complexityLevel}
          onChangeText={setComplexityLevel}
          keyboardType="number-pad"
        />
        <LabeledInput
          label="Matching Score (0-100)"
          value={matchingScore}
          onChangeText={setMatchingScore}
          keyboardType="numeric"
        />
        <View style={styles.rowAction}>
          <ActionButton
            label={isRecommended ? "Recommended: YES" : "Recommended: NO"}
            onPress={() => setIsRecommended((prev) => !prev)}
            variant="secondary"
          />
        </View>
        <LabeledInput
          label="Estimated Cost Amount"
          value={estimatedAmount}
          onChangeText={setEstimatedAmount}
          keyboardType="numeric"
        />
        <LabeledInput label="Currency" value={currency} onChangeText={setCurrency} />
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={styles.actions}>
        <ActionButton
          label={loading ? "Loading..." : "Load Dispatch Context"}
          onPress={() => void loadDispatchContext()}
          disabled={loading}
          variant="secondary"
        />
        <ActionButton
          label={loading ? "Creating..." : "Create Matching Result"}
          onPress={() => void handleCreateMatchingResult()}
          disabled={loading}
        />
        <ActionButton
          label={loading ? "Assigning..." : "Assign Provider + Create Assignment"}
          onPress={() => void handleAssignProviderAndCreateAssignment()}
          disabled={loading}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Service Agents ({agents.length})</Text>
        {agents.slice(0, 20).map((agent) => (
          <Pressable
            key={agent.id}
            style={styles.row}
            onPress={() => setAgentId(agent.id)}
          >
            <Text style={styles.rowTitle}>{agent.fullName}</Text>
            <Text style={styles.meta}>ID: {agent.id}</Text>
            <Text style={styles.meta}>Active: {agent.isActive ? "Yes" : "No"}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Matching ({matches.length})</Text>
        {matches.map((match) => (
          <View key={match.id} style={styles.row}>
            <Text style={styles.rowTitle}>Agent: {match.serviceAgentId}</Text>
            <Text style={styles.meta}>Score: {match.matchingScore}</Text>
            <Text style={styles.meta}>
              Complexity: {match.supportedComplexity?.level ?? "N/A"}
            </Text>
            <Text style={styles.meta}>Recommended: {match.isRecommended ? "Yes" : "No"}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Recommended ({recommendedMatches.length})</Text>
        {recommendedMatches.map((match) => (
          <Text key={match.id} style={styles.meta}>
            {match.serviceAgentId} | score {match.matchingScore}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Assignments ({assignments.length})</Text>
        {assignments.map((assignment) => (
          <View key={assignment.id} style={styles.row}>
            <Text style={styles.rowTitle}>Agent: {assignment.agentId ?? "-"}</Text>
            <Text style={styles.meta}>Assigned: {formatDateTime(assignment.assignedAt)}</Text>
            <Text style={styles.meta}>
              Estimated:{" "}
              {formatCurrency(
                assignment.estimatedCost.amount,
                assignment.estimatedCost.currency
              )}
            </Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 8
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  rowAction: {
    marginTop: 4
  },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    gap: 2,
    backgroundColor: "#fff"
  },
  rowTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
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

