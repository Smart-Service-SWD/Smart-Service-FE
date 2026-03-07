import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ALL_REQUESTS_QUERY,
  ASSIGNMENTS_BY_REQUEST_QUERY,
  MATCHING_RESULTS_BY_REQUEST_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatDateTime } from "../../../shared/utils/format";
import type {
  AssignmentItem,
  MatchingResultItem,
  ServiceRequestItem
} from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";

interface AllRequestsResponse {
  getServiceRequests: ServiceRequestItem[];
}

interface AssignmentByRequestResponse {
  getAssignmentsByServiceRequestId: AssignmentItem[];
}

interface MatchingByRequestResponse {
  getMatchingResultsByServiceRequestId: MatchingResultItem[];
}

const statusOptions = [
  "ALL",
  "AWAITING_ANALYSIS",
  "CREATED",
  "URGENT_DISPATCH",
  "PENDING_REVIEW",
  "APPROVED",
  "ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED"
] as const;

export default function AgentRequestBoardScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<ServiceRequestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("ALL");
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [matches, setMatches] = useState<MatchingResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    if (statusFilter === "ALL") {
      return items;
    }
    return items.filter((item) => item.status === statusFilter);
  }, [items, statusFilter]);

  const loadBoard = async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<AllRequestsResponse>(
        ALL_REQUESTS_QUERY,
        undefined,
        session.accessToken
      );
      setItems(data.getServiceRequests);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  const loadLinkedData = async () => {
    if (!session) {
      return;
    }
    if (!selectedRequestId.trim()) {
      setError("Request ID is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [assignmentData, matchingData] = await Promise.all([
        graphqlRequest<AssignmentByRequestResponse, { serviceRequestId: string }>(
          ASSIGNMENTS_BY_REQUEST_QUERY,
          { serviceRequestId: selectedRequestId.trim() },
          session.accessToken
        ),
        graphqlRequest<MatchingByRequestResponse, { serviceRequestId: string }>(
          MATCHING_RESULTS_BY_REQUEST_QUERY,
          { serviceRequestId: selectedRequestId.trim() },
          session.accessToken
        )
      ]);
      setAssignments(assignmentData.getAssignmentsByServiceRequestId);
      setMatches(matchingData.getMatchingResultsByServiceRequestId);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <ScreenLayout title="Request Board" subtitle="Agent view: all visible requests">
      <View style={styles.filterRow}>
        {statusOptions.map((option) => {
          const active = statusFilter === option;
          return (
            <Pressable
              key={option}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setStatusFilter(option)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <Text style={styles.meta}>Loading...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Requests ({filteredItems.length})</Text>
        {filteredItems.slice(0, 25).map((item) => (
          <View key={item.id} style={styles.row}>
            <Text style={styles.rowTitle}>{item.description}</Text>
            <Text style={styles.meta}>ID: {item.id}</Text>
            <Text style={styles.meta}>Status: {item.status}</Text>
            <Text style={styles.meta}>Created: {formatDateTime(item.createdAt)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Lookup Assignments + Matching</Text>
        <LabeledInput
          label="Request ID"
          value={selectedRequestId}
          onChangeText={setSelectedRequestId}
          placeholder="Paste request ID"
          autoCapitalize="none"
        />
        <ActionButton
          label={loading ? "Loading..." : "Load Linked Data"}
          onPress={() => void loadLinkedData()}
          disabled={loading}
          variant="secondary"
        />
        <Text style={styles.meta}>Assignments: {assignments.length}</Text>
        <Text style={styles.meta}>Matching Results: {matches.length}</Text>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff"
  },
  filterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  filterText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "700"
  },
  filterTextActive: {
    color: colors.primary
  },
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
  error: {
    color: colors.danger,
    fontSize: 13
  }
});
