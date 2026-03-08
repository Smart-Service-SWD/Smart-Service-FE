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
    <ScreenLayout title="Bảng điều khiển Admin" subtitle="Tổng quan hệ thống">
      {loading ? <Text style={styles.loading}>Đang tải...</Text> : null}
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      <ActionButton
        label={loading ? "Đang làm mới..." : "Làm mới"}
        onPress={() => void load()}
        disabled={loading}
        variant="secondary"
      />

      {summary ? (
        <View style={styles.card}>
          <Text style={styles.title}>Tổng quan hệ thống</Text>
          <Text style={styles.meta}>Tổng người dùng: {summary.totalUsers}</Text>
          <Text style={styles.meta}>Tổng nhân viên: {summary.totalStaff}</Text>
          <Text style={styles.meta}>Tổng thợ kỹ thuật: {summary.totalAgents}</Text>
          <Text style={styles.meta}>Tổng dịch vụ: {summary.totalServices}</Text>
          <Text style={styles.meta}>Tổng yêu cầu: {summary.totalRequests}</Text>
          <Text style={styles.meta}>Yêu cầu chờ xử lý: {summary.pendingRequests}</Text>
          <Text style={styles.meta}>Yêu cầu hoàn thành: {summary.completedRequests}</Text>
          <Text style={styles.meta}>
            Doanh thu hôm nay: {formatCurrency(summary.todayRevenue)}
          </Text>
          <Text style={styles.meta}>
            Doanh thu tháng: {formatCurrency(summary.monthlyRevenue)}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.title}>Phân bổ vai trò</Text>
        <Text style={styles.meta}>Thợ kỹ thuật: {agents.length}</Text>
        <Text style={styles.meta}>Nhân viên: {staffs.length}</Text>
        <Text style={styles.meta}>Khách hàng: {customers.length}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Thợ kỹ thuật ({agents.length})</Text>
        {agents.map((agent) => (
          <View key={agent.id} style={styles.agentRow}>
            <Text style={styles.agentName}>{agent.fullName}</Text>
            <Text style={styles.agentMeta}>{agent.email}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Nhân viên ({staffs.length})</Text>
        {staffs.map((staff) => (
          <View key={staff.id} style={styles.agentRow}>
            <Text style={styles.agentName}>{staff.fullName}</Text>
            <Text style={styles.agentMeta}>{staff.email}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Khách hàng ({customers.length})</Text>
        {customers.map((customer) => (
          <View key={customer.id} style={styles.agentRow}>
            <Text style={styles.agentName}>{customer.fullName}</Text>
            <Text style={styles.agentMeta}>{customer.email}</Text>
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
