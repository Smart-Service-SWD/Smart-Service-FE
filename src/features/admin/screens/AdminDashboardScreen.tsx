import { useEffect, useMemo, useState } from "react";
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
import SectionCard from "../../../shared/ui/SectionCard";
import MetricTile from "../../../shared/ui/MetricTile";
import StatusBadge from "../../../shared/ui/StatusBadge";

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

const getUserInitials = (fullName?: string | null) => {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (!parts.length) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

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
      const [data, agentData, staffData, customerData] = await Promise.all([
        graphqlRequest<AdminDashboardResponse>(
          ADMIN_DASHBOARD_QUERY,
          undefined,
          session.accessToken
        ),
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

  const overviewTiles = useMemo(
    () => [
      {
        label: "Người dùng",
        value: summary?.totalUsers ?? 0,
        helper: "Tổng tài khoản trên hệ thống",
        tone: "primary" as const
      },
      {
        label: "Yêu cầu",
        value: summary?.totalRequests ?? 0,
        helper: `${summary?.pendingRequests ?? 0} đơn chờ xử lý`,
        tone: "default" as const
      },
      {
        label: "Doanh thu hôm nay",
        value: formatCurrency(summary?.todayRevenue ?? 0),
        helper: "Giá trị phát sinh trong ngày",
        tone: "success" as const
      },
      {
        label: "Doanh thu tháng",
        value: formatCurrency(summary?.monthlyRevenue ?? 0),
        helper: `${summary?.completedRequests ?? 0} đơn đã hoàn thành`,
        tone: "warning" as const
      }
    ],
    [summary]
  );

  const groups = [
    {
      title: "Thợ kỹ thuật",
      users: agents,
      tone: "primary" as const,
      emptyText: "Chưa có thợ kỹ thuật nào trong hệ thống."
    },
    {
      title: "Nhân viên",
      users: staffs,
      tone: "success" as const,
      emptyText: "Chưa có tài khoản staff nào trong hệ thống."
    },
    {
      title: "Khách hàng",
      users: customers,
      tone: "warning" as const,
      emptyText: "Chưa có khách hàng nào trong hệ thống."
    }
  ];

  return (
    <ScreenLayout title="Bảng điều khiển Admin" subtitle="Tổng quan hệ thống theo góc nhìn mobile">
      <SectionCard
        title="Tổng quan nhanh"
        subtitle="Theo dõi quy mô hệ thống, tiến độ yêu cầu và doanh thu ngay trên một màn hình"
        tone="primary"
      >
        <View style={styles.metricGrid}>
          {overviewTiles.map((tile) => (
            <MetricTile
              key={tile.label}
              label={tile.label}
              value={tile.value}
              helper={tile.helper}
              tone={tile.tone}
            />
          ))}
        </View>
        <ActionButton
          label={loading ? "Đang làm mới..." : "Làm mới dữ liệu"}
          onPress={() => void load()}
          disabled={loading}
          variant="secondary"
        />
      </SectionCard>

      {!!error ? (
        <SectionCard tone="danger">
          <Text style={styles.error}>{error}</Text>
        </SectionCard>
      ) : null}

      {summary ? (
        <SectionCard
          title="Cân bằng vận hành"
          subtitle="Các con số này giúp admin nhìn nhanh lượng người dùng và khối lượng đơn"
        >
          <View style={styles.badgeRow}>
            <StatusBadge label={`Staff ${summary.totalStaff}`} tone="success" />
            <StatusBadge label={`Agent ${summary.totalAgents}`} tone="primary" />
            <StatusBadge label={`Dịch vụ ${summary.totalServices}`} tone="warning" />
            <StatusBadge label={`Hoàn thành ${summary.completedRequests}`} tone="neutral" />
          </View>
          <Text style={styles.metaText}>
            Tổng số yêu cầu đang chờ xử lý: {summary.pendingRequests}. Tổng dịch vụ đang phục vụ: {summary.totalServices}.
          </Text>
        </SectionCard>
      ) : null}

      {groups.map((group) => (
        <SectionCard
          key={group.title}
          title={`${group.title} (${group.users.length})`}
          subtitle="Danh sách rút gọn theo role để admin xem nhanh trên mobile"
        >
          <View style={styles.userList}>
            {group.users.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{getUserInitials(user.fullName)}</Text>
                </View>
                <View style={styles.userContent}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <StatusBadge
                      label={user.isLocked ? "Khóa" : "Hoạt động"}
                      tone={user.isLocked ? "danger" : group.tone}
                    />
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>
            ))}
          </View>
          {!group.users.length ? <Text style={styles.empty}>{group.emptyText}</Text> : null}
        </SectionCard>
      ))}
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  metaText: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19
  },
  userList: {
    gap: 10
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 12,
    backgroundColor: colors.surfaceRaised
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  userAvatarText: {
    color: colors.primaryStrong,
    fontSize: 16,
    fontWeight: "800"
  },
  userContent: {
    flex: 1,
    gap: 4
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  userName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  },
  empty: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18
  }
});
