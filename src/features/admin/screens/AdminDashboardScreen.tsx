import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  ADMIN_DASHBOARD_QUERY,
  USERS_BY_ROLE_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatCurrency } from "../../../shared/utils/format";
import type { UserProfile } from "../../../shared/types/domain";
import ActionButton from "../../../shared/ui/ActionButton";

interface DashboardSummary {
  totalUsers: number;
  totalStaff: number;
  totalAgents: number;
  totalServices: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

interface AdminDashboardResponse {
  getDashboardSummary: DashboardSummary;
}

interface UsersByRoleResponse {
  getUsersByRole: UserProfile[];
}

export default function AdminDashboardScreen() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [agents, setAgents] = useState<UserProfile[]>([]);
  const [staffs, setStaffs] = useState<UserProfile[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<AdminDashboardResponse>(
        ADMIN_DASHBOARD_QUERY,
        undefined,
        session.accessToken
      );

      const [agentData, staffData, customerData] = await Promise.all([
        graphqlRequest<UsersByRoleResponse, { role: string }>(
          USERS_BY_ROLE_QUERY,
          { role: "AGENT" },
          session.accessToken
        ),
        graphqlRequest<UsersByRoleResponse, { role: string }>(
          USERS_BY_ROLE_QUERY,
          { role: "STAFF" },
          session.accessToken
        ),
        graphqlRequest<UsersByRoleResponse, { role: string }>(
          USERS_BY_ROLE_QUERY,
          { role: "CUSTOMER" },
          session.accessToken
        )
      ]);
      setSummary(data.getDashboardSummary);
      setAgents(agentData.getUsersByRole);
      setStaffs(staffData.getUsersByRole);
      setCustomers(customerData.getUsersByRole);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  return (
    <ScreenLayout title="Admin Dashboard" subtitle="GraphQL summary metrics">
      {loading ? <Text style={styles.loading}>Loading...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton
        label={loading ? "Refreshing..." : "Refresh Dashboard"}
        onPress={() => void load()}
        disabled={loading}
        variant="secondary"
      />

      {summary ? (
        <View style={styles.card}>
          <Text style={styles.title}>System Summary</Text>
          <Text style={styles.meta}>Total Users: {summary.totalUsers}</Text>
          <Text style={styles.meta}>Total Staff: {summary.totalStaff}</Text>
          <Text style={styles.meta}>Total Agents: {summary.totalAgents}</Text>
          <Text style={styles.meta}>Total Services: {summary.totalServices}</Text>
          <Text style={styles.meta}>Total Requests: {summary.totalRequests}</Text>
          <Text style={styles.meta}>Pending Requests: {summary.pendingRequests}</Text>
          <Text style={styles.meta}>Completed Requests: {summary.completedRequests}</Text>
          <Text style={styles.meta}>
            Today Revenue: {formatCurrency(summary.todayRevenue)}
          </Text>
          <Text style={styles.meta}>
            Monthly Revenue: {formatCurrency(summary.monthlyRevenue)}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Role Distribution</Text>
        <Text style={styles.meta}>Agents: {agents.length}</Text>
        <Text style={styles.meta}>Staff: {staffs.length}</Text>
        <Text style={styles.meta}>Customers: {customers.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Agents ({agents.length})</Text>
        {agents.map((agent) => (
          <View key={agent.id} style={styles.agentRow}>
            <Text style={styles.agentName}>{agent.fullName}</Text>
            <Text style={styles.agentMeta}>{agent.email}</Text>
          </View>
        ))}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: {
    color: colors.textMuted
  },
  error: {
    color: colors.danger,
    fontSize: 13
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 6
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 2
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13
  },
  agentRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    gap: 2
  },
  agentName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  agentMeta: {
    color: colors.textMuted,
    fontSize: 12
  }
});
