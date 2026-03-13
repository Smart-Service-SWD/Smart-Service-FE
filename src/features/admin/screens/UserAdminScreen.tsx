import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  SERVICE_CATEGORIES_QUERY,
  SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
  USERS_QUERY
} from "../../../shared/api/graphqlDocuments";
import {
  asErrorMessage,
  formatRoleLabel,
  formatShortId
} from "../../../shared/utils/format";
import type {
  ServiceCategory,
  ServiceDefinition,
  UserProfile
} from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import SectionCard from "../../../shared/ui/SectionCard";
import MetricTile from "../../../shared/ui/MetricTile";
import StatusBadge from "../../../shared/ui/StatusBadge";
import {
  type CreateAgentCapabilityPayload,
  createAgentUser,
  createCustomerUser,
  createStaffUser,
  setUserLockState,
  updateUserRole
} from "../api/adminApi";

interface UsersResponse {
  getUsers: UserProfile[];
}

interface CategoriesResponse {
  getServiceCategories: ServiceCategory[];
}

interface ServicesByCategoryResponse {
  getServiceDefinitionsByCategory: ServiceDefinition[];
}

const roleOptions = ["CUSTOMER", "STAFF", "AGENT", "ADMIN"] as const;
const createRoleOptions = ["CUSTOMER", "STAFF", "AGENT"] as const;

const toBackendRole = (role: string): string =>
  role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

interface CapabilityDraft {
  key: string;
  categoryId: string;
  maxComplexityLevel: number;
  serviceIds: string[];
}

const createCapabilityDraft = (): CapabilityDraft => ({
  key: `${Date.now()}-${Math.random()}`,
  categoryId: "",
  maxComplexityLevel: 3,
  serviceIds: []
});

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

export default function UserAdminScreen() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<
    Record<string, ServiceDefinition[]>
  >({});
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetRole, setTargetRole] = useState<(typeof roleOptions)[number]>("CUSTOMER");
  const [lockFlag, setLockFlag] = useState(false);
  const [newUserRole, setNewUserRole] =
    useState<(typeof createRoleOptions)[number]>("CUSTOMER");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentCapabilities, setAgentCapabilities] = useState<CapabilityDraft[]>([
    createCapabilityDraft()
  ]);
  const [loading, setLoading] = useState(false);
  const [loadingServicesForCategory, setLoadingServicesForCategory] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const roleSummary = useMemo(
    () => ({
      locked: users.filter((user) => user.isLocked).length,
      staff: users.filter((user) => String(user.role).toUpperCase() === "STAFF").length,
      agents: users.filter((user) => String(user.role).toUpperCase() === "AGENT").length,
      customers: users.filter((user) => String(user.role).toUpperCase() === "CUSTOMER").length
    }),
    [users]
  );

  const selectUser = (user: UserProfile) => {
    setSelectedUserId(user.id);
    setTargetRole(
      (user.role?.toString().toUpperCase() as (typeof roleOptions)[number]) ?? "CUSTOMER"
    );
    setLockFlag(!user.isLocked);
    setError("");
    setSuccess("");
  };

  const loadUsers = async (token: string) => {
    const data = await graphqlRequest<UsersResponse>(USERS_QUERY, undefined, token);
    setUsers(data.getUsers);
  };

  const loadCategories = async () => {
    const data = await graphqlRequest<CategoriesResponse>(SERVICE_CATEGORIES_QUERY);
    setCategories(data.getServiceCategories);
  };

  const ensureServicesForCategory = async (categoryId: string, forceRefresh = false) => {
    if (!categoryId) {
      return;
    }
    if (!forceRefresh && servicesByCategory[categoryId]?.length) {
      return;
    }

    setLoadingServicesForCategory(categoryId);
    try {
      const data = await graphqlRequest<ServicesByCategoryResponse, { categoryId: string }>(
        SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
        { categoryId }
      );

      setServicesByCategory((current) => ({
        ...current,
        [categoryId]: data.getServiceDefinitionsByCategory.filter((service) => service.isActive)
      }));
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoadingServicesForCategory("");
    }
  };

  const loadScreenData = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      await Promise.all([loadUsers(session.accessToken), loadCategories()]);
      setServicesByCategory({});
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadScreenData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useFocusEffect(
    useCallback(() => {
      setServicesByCategory({});
    }, [])
  );

  const setCapabilityCategory = (key: string, categoryId: string) => {
    setAgentCapabilities((current) =>
      current.map((item) =>
        item.key === key ? { ...item, categoryId, serviceIds: [] } : item
      )
    );
    void ensureServicesForCategory(categoryId);
  };

  const toggleCapabilityService = (key: string, serviceId: string) => {
    setAgentCapabilities((current) =>
      current.map((item) => {
        if (item.key !== key) {
          return item;
        }

        const serviceIds = item.serviceIds.includes(serviceId)
          ? item.serviceIds.filter((id) => id !== serviceId)
          : [...item.serviceIds, serviceId];

        return { ...item, serviceIds };
      })
    );
  };

  const setCapabilityComplexity = (key: string, level: number) => {
    setAgentCapabilities((current) =>
      current.map((item) =>
        item.key === key ? { ...item, maxComplexityLevel: level } : item
      )
    );
  };

  const addCapability = () => {
    setAgentCapabilities((current) => [...current, createCapabilityDraft()]);
  };

  const removeCapability = (key: string) => {
    setAgentCapabilities((current) =>
      current.length === 1 ? current : current.filter((item) => item.key !== key)
    );
  };

  const buildAgentCapabilities = (): CreateAgentCapabilityPayload[] | null => {
    const normalized = agentCapabilities.map((item) => ({
      categoryId: item.categoryId.trim(),
      maxComplexityLevel: item.maxComplexityLevel,
      serviceIds: item.serviceIds
    }));

    if (
      normalized.some(
        (item) =>
          !item.categoryId ||
          item.maxComplexityLevel < 1 ||
          item.maxComplexityLevel > 5 ||
          item.serviceIds.length === 0
      )
    ) {
      setError("Mỗi capability của thợ phải có danh mục, độ phức tạp 1-5 và ít nhất 1 dịch vụ.");
      return null;
    }

    const uniqueCategoryCount = new Set(normalized.map((item) => item.categoryId)).size;
    if (uniqueCategoryCount !== normalized.length) {
      setError("Mỗi capability nên dùng một danh mục riêng để tránh trùng dữ liệu.");
      return null;
    }

    return normalized;
  };

  const handleCreateUser = async () => {
    if (!session) {
      return;
    }
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError("Họ tên, email và số điện thoại là bắt buộc");
      return;
    }

    let agentCapabilitiesPayload: CreateAgentCapabilityPayload[] | null = null;
    if (newUserRole === "AGENT") {
      agentCapabilitiesPayload = buildAgentCapabilities();
      if (!agentCapabilitiesPayload) {
        return;
      }
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let id = "";
      if (newUserRole === "CUSTOMER") {
        id = await createCustomerUser(session.accessToken, {
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim()
        });
      } else if (newUserRole === "AGENT" && agentCapabilitiesPayload) {
        id = await createAgentUser(session.accessToken, {
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          capabilities: agentCapabilitiesPayload
        });
      } else {
        id = await createStaffUser(session.accessToken, {
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim()
        });
      }
      setSuccess(
        newUserRole === "AGENT"
          ? `Tạo thợ thành công! ID: ${id}\nHệ thống đã tạo ServiceAgent và gửi mật khẩu tạm qua email.`
          : `Tạo tài khoản ${formatRoleLabel(newUserRole)} thành công! ID: ${id}`
      );
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      setAgentCapabilities([createCapabilityDraft()]);
      await loadUsers(session.accessToken);
    } catch (createError) {
      setError(asErrorMessage(createError));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!session) {
      return;
    }
    if (!selectedUserId.trim()) {
      setError("Chọn người dùng từ danh sách trước");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await updateUserRole(session.accessToken, selectedUserId.trim(), {
        role: toBackendRole(targetRole)
      });
      setSuccess("Cập nhật quyền thành công");
      await loadUsers(session.accessToken);
    } catch (updateError) {
      setError(asErrorMessage(updateError));
    } finally {
      setLoading(false);
    }
  };

  const handleLockState = async () => {
    if (!session) {
      return;
    }
    if (!selectedUserId.trim()) {
      setError("Chọn người dùng từ danh sách trước");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await setUserLockState(session.accessToken, selectedUserId.trim(), {
        isLocked: lockFlag
      });
      setSuccess(lockFlag ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
      await loadUsers(session.accessToken);
      setLockFlag(!lockFlag);
    } catch (lockError) {
      setError(asErrorMessage(lockError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      title="Quản lý người dùng"
      subtitle="Tạo tài khoản, đổi quyền và khóa hoặc mở tài khoản theo bố cục gọn cho mobile"
    >
      <SectionCard tone="primary" title="Tổng quan người dùng">
        <View style={styles.metricGrid}>
          <MetricTile label="Tổng tài khoản" value={users.length} helper="Số user đang có" tone="primary" />
          <MetricTile label="Staff" value={roleSummary.staff} helper="Nhân viên nội bộ" tone="success" />
          <MetricTile label="Agent" value={roleSummary.agents} helper="Thợ kỹ thuật" tone="warning" />
          <MetricTile label="Đang khóa" value={roleSummary.locked} helper="Cần kiểm tra nếu tăng bất thường" />
        </View>
        {loading ? <Text style={styles.meta}>Đang đồng bộ dữ liệu người dùng...</Text> : null}
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
        title="Tạo người dùng mới"
        subtitle="Chọn role trước, sau đó điền thông tin. Nếu tạo agent thì cấu hình capability ngay trong cùng màn hình."
      >
        <View style={styles.optionRow}>
          {createRoleOptions.map((role) => {
            const active = newUserRole === role;
            return (
              <Pressable
                key={role}
                style={[styles.optionChip, active && styles.optionChipActive]}
                onPress={() => setNewUserRole(role)}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {formatRoleLabel(role)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <LabeledInput label="Họ & tên" value={fullName} onChangeText={setFullName} />
        <LabeledInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <LabeledInput
          label="Số điện thoại"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        {newUserRole === "AGENT" ? (
          <View style={styles.subCard}>
            <Text style={styles.subTitle}>Capability của thợ</Text>
            <Text style={styles.meta}>
              Mỗi capability nên đại diện cho một danh mục, nhiều dịch vụ và một mức độ phức tạp tối đa.
            </Text>
            {agentCapabilities.map((capability, index) => {
              const isLoadingServices = loadingServicesForCategory === capability.categoryId;
              const services = capability.categoryId
                ? servicesByCategory[capability.categoryId] ?? []
                : [];
              const hasCategory = !!capability.categoryId;
              const hasServices = capability.serviceIds.length > 0;

              return (
                <View key={capability.key} style={styles.capabilityCard}>
                  <View style={styles.capabilityHeader}>
                    <Text style={styles.capabilityTitle}>Capability #{index + 1}</Text>
                    <StatusBadge
                      label={hasServices ? `${capability.serviceIds.length} dịch vụ` : "Chưa chọn dịch vụ"}
                      tone={hasServices ? "success" : "warning"}
                    />
                  </View>

                  <Text style={styles.sectionLabel}>1. Chọn danh mục</Text>
                  <View style={styles.optionRow}>
                    {categories.map((category) => {
                      const active = capability.categoryId === category.id;
                      return (
                        <Pressable
                          key={`${capability.key}-${category.id}`}
                          style={[styles.optionChip, active && styles.optionChipActive]}
                          onPress={() => setCapabilityCategory(capability.key, category.id)}
                        >
                          <Text style={[styles.optionText, active && styles.optionTextActive]}>
                            {category.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {hasCategory ? (
                    <>
                      <Text style={styles.sectionLabel}>
                        2. Chọn dịch vụ {hasServices ? `(đã chọn ${capability.serviceIds.length})` : ""}
                      </Text>
                      {isLoadingServices ? (
                        <Text style={styles.meta}>Đang tải dịch vụ...</Text>
                      ) : services.length === 0 ? (
                        <Text style={styles.warning}>
                          Danh mục này chưa có dịch vụ nào. Hãy thêm dịch vụ trong màn Quản lý dịch vụ trước.
                        </Text>
                      ) : (
                        <View style={styles.optionRow}>
                          {services.map((service) => {
                            const active = capability.serviceIds.includes(service.id);
                            return (
                              <Pressable
                                key={`${capability.key}-${service.id}`}
                                style={[styles.optionChip, active && styles.optionChipActive]}
                                onPress={() => toggleCapabilityService(capability.key, service.id)}
                              >
                                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                                  {service.name}
                                  {service.complexityRange?.length === 2
                                    ? ` • ${service.complexityRange[0]}-${service.complexityRange[1]}`
                                    : ""}
                                  {service.isDangerous ? " • Canh báo" : ""}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      )}

                      <Text style={styles.sectionLabel}>3. Mức độ phức tạp tối đa</Text>
                      <View style={styles.optionRow}>
                        {[1, 2, 3, 4, 5].map((level) => {
                          const active = capability.maxComplexityLevel === level;
                          return (
                            <Pressable
                              key={`${capability.key}-level-${level}`}
                              style={[styles.optionChip, active && styles.optionChipActive]}
                              onPress={() => setCapabilityComplexity(capability.key, level)}
                            >
                              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                                Level {level}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <Text style={styles.warning}>
                      Chọn danh mục để hệ thống nạp danh sách dịch vụ tương ứng.
                    </Text>
                  )}

                  {agentCapabilities.length > 1 ? (
                    <ActionButton
                      label="Xóa capability này"
                      onPress={() => removeCapability(capability.key)}
                      variant="danger"
                    />
                  ) : null}
                </View>
              );
            })}
            <ActionButton label="Thêm Capability" onPress={addCapability} variant="secondary" />
          </View>
        ) : null}

        <ActionButton
          label={loading ? "Đang tạo..." : "Tạo người dùng"}
          onPress={() => void handleCreateUser()}
          disabled={loading}
        />
      </SectionCard>

      <SectionCard
        title="Cập nhật quyền và trạng thái khóa"
        subtitle="Chạm vào một người dùng trong danh sách bên dưới để nạp sẵn thông tin thao tác"
      >
        {selectedUser ? (
          <View style={styles.selectedUserBanner}>
            <View style={styles.selectedUserIdentity}>
              <View style={styles.selectedAvatar}>
                <Text style={styles.selectedAvatarText}>{getUserInitials(selectedUser.fullName)}</Text>
              </View>
              <View style={styles.selectedUserText}>
                <Text style={styles.selectedUserName}>{selectedUser.fullName}</Text>
                <Text style={styles.meta}>{selectedUser.email}</Text>
              </View>
            </View>
            <View style={styles.badgeRow}>
              <StatusBadge label={formatRoleLabel(String(selectedUser.role))} tone="primary" />
              <StatusBadge
                label={selectedUser.isLocked ? "Đang khóa" : "Đang hoạt động"}
                tone={selectedUser.isLocked ? "danger" : "success"}
              />
            </View>
          </View>
        ) : (
          <Text style={styles.hint}>Chưa chọn người dùng. Hãy nhấn vào một dòng trong danh sách ở cuối màn hình.</Text>
        )}

        <Text style={styles.sectionLabel}>Đổi quyền sang</Text>
        <View style={styles.optionRow}>
          {roleOptions.map((role) => {
            const active = targetRole === role;
            return (
              <Pressable
                key={role}
                style={[styles.optionChip, active && styles.optionChipActive]}
                onPress={() => setTargetRole(role)}
              >
                <Text style={[styles.optionText, active && styles.optionTextActive]}>
                  {formatRoleLabel(role)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ActionButton
          label={loading ? "Đang cập nhật..." : "Cập nhật quyền"}
          onPress={() => void handleUpdateRole()}
          disabled={loading || !selectedUserId}
          variant="secondary"
        />

        <Text style={styles.sectionLabel}>Khóa hoặc mở khóa tài khoản</Text>
        <Text style={styles.meta}>
          {selectedUser
            ? `Trạng thái hiện tại: ${selectedUser.isLocked ? "Đang bị khóa" : "Đang hoạt động"}`
            : "Chọn người dùng để xem trạng thái hiện tại"}
        </Text>
        <View style={styles.optionRow}>
          <Pressable
            style={[styles.optionChip, !lockFlag && styles.optionChipActive]}
            onPress={() => setLockFlag(false)}
          >
            <Text style={[styles.optionText, !lockFlag && styles.optionTextActive]}>Mở khóa</Text>
          </Pressable>
          <Pressable
            style={[styles.optionChip, lockFlag && styles.optionChipDanger]}
            onPress={() => setLockFlag(true)}
          >
            <Text style={[styles.optionText, lockFlag && styles.optionTextDanger]}>Khóa</Text>
          </Pressable>
        </View>
        <ActionButton
          label={loading ? "Đang lưu..." : lockFlag ? "Khóa tài khoản" : "Mở khóa tài khoản"}
          onPress={() => void handleLockState()}
          disabled={loading || !selectedUserId}
          variant={lockFlag ? "danger" : "secondary"}
        />
      </SectionCard>

      <SectionCard
        title={`Danh sách người dùng (${users.length})`}
        subtitle="Danh sách đầy đủ để chọn nhanh người dùng cần thao tác"
      >
        <View style={styles.userList}>
          {users.map((user) => (
            <Pressable
              key={user.id}
              style={[styles.userRow, selectedUserId === user.id && styles.userRowSelected]}
              onPress={() => selectUser(user)}
            >
              <View style={styles.userRowTop}>
                <View style={styles.userIdentity}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{getUserInitials(user.fullName)}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.fullName}</Text>
                    <Text style={styles.meta}>{user.email}</Text>
                  </View>
                </View>
                <StatusBadge
                  label={user.isLocked ? "Khóa" : "Mở"}
                  tone={user.isLocked ? "danger" : "success"}
                />
              </View>
              <View style={styles.badgeRow}>
                <StatusBadge label={formatRoleLabel(String(user.role))} tone="primary" />
                <StatusBadge label={`SĐT ${user.phoneNumber || "-"}`} tone="neutral" />
              </View>
              <Text style={[styles.meta, styles.idText]}>Mã: {formatShortId(user.id)}</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>
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
  subCard: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 22,
    padding: 14,
    gap: 12,
    backgroundColor: colors.surfaceRaised
  },
  subTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 15
  },
  capabilityCard: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 12,
    gap: 10,
    backgroundColor: colors.surface
  },
  capabilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  capabilityTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14
  },
  sectionLabel: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 2
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  selectedUserBanner: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: 22,
    padding: 14,
    backgroundColor: colors.primarySoftAlt
  },
  selectedUserIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  selectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  selectedAvatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18
  },
  selectedUserText: {
    flex: 1,
    gap: 4
  },
  selectedUserName: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  optionChip: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.surfaceRaised
  },
  optionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  optionChipDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  optionTextActive: {
    color: colors.primaryStrong
  },
  optionTextDanger: {
    color: colors.danger
  },
  userList: {
    gap: 10
  },
  userRow: {
    borderWidth: 1,
    borderColor: "rgba(100, 116, 139, 0.16)",
    borderRadius: 20,
    padding: 12,
    gap: 10,
    backgroundColor: colors.surfaceRaised
  },
  userRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoftAlt
  },
  userRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10
  },
  userIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  userAvatarText: {
    color: colors.primaryStrong,
    fontSize: 15,
    fontWeight: "800"
  },
  userInfo: {
    flex: 1,
    gap: 3
  },
  userName: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 14
  },
  idText: {
    fontSize: 11,
    opacity: 0.75
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
  },
  warning: {
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
