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

  // When a user is tapped from the list, sync role + lock flag to their current state
  const selectUser = (user: UserProfile) => {
    setSelectedUserId(user.id);
    setTargetRole(
      (user.role?.toString().toUpperCase() as (typeof roleOptions)[number]) ?? "CUSTOMER"
    );
    // Default lock button to the opposite of current state (most useful action)
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
    // Chỉ skip khi đã có dữ liệu VÀ không bị force refresh
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
      // Invalidate service cache khi reload màn hình
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

  // Xóa cache service khi quay lại tab này để tránh stale data từ tab Services
  useFocusEffect(
    useCallback(() => {
      setServicesByCategory({});
    }, [])
  );

  const setCapabilityCategory = (key: string, categoryId: string) => {
    setAgentCapabilities((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, categoryId, serviceIds: [] }
          : item
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

    // Validate agent capabilities BEFORE setting loading to avoid stuck spinner
    let agentCapabilitiesPayload: CreateAgentCapabilityPayload[] | null = null;
    if (newUserRole === "AGENT") {
      agentCapabilitiesPayload = buildAgentCapabilities();
      if (!agentCapabilitiesPayload) {
        return; // buildAgentCapabilities already set error
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
      // Sync lockFlag sang hành động ngược chiều dựa trên trạng thái vừa áp dụng
      setLockFlag(!lockFlag);
    } catch (lockError) {
      setError(asErrorMessage(lockError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="Quản lý người dùng" subtitle="Tạo tài khoản, đổi quyền, khóa/mở">
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}
      {loading ? <Text style={styles.meta}>Đang xử lý...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Tạo người dùng mới</Text>
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
            <Text style={styles.subTitle}>Agent Capabilities (kỹ năng của thợ)</Text>
            <Text style={styles.meta}>
              Tạo thợ sẽ đồng thời tạo User + ServiceAgent + danh sách capabilities.
              Mật khẩu tạm sẽ được gửi về email.
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
                  <Text style={styles.capabilityTitle}>Capability #{index + 1}</Text>
                  <Text style={styles.meta}>1 danh mục, nhiều dịch vụ, 1 mức độ phức tạp tối đa.</Text>

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
                          <Text
                            style={[styles.optionText, active && styles.optionTextActive]}
                          >
                            {category.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {hasCategory ? (
                    <>
                      <Text style={styles.sectionLabel}>
                        2. Chọn dịch vụ được xử lý{hasServices ? ` (đã chọn ${capability.serviceIds.length})` : ""}
                      </Text>
                      {isLoadingServices ? (
                        <Text style={styles.meta}>Đang tải dịch vụ...</Text>
                      ) : services.length === 0 ? (
                        <Text style={styles.warning}>
                          Danh mục này chưa có dịch vụ nào. Hãy thêm dịch vụ trong mục Quản lý dịch vụ trước.
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
                                <Text
                                  style={[styles.optionText, active && styles.optionTextActive]}
                                >
                                  {service.name}
                                  {service.complexityRange?.length === 2
                                    ? ` • ${service.complexityRange[0]}-${service.complexityRange[1]}`
                                    : ""}
                                  {service.isDangerous ? " • ⚠" : ""}
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
                              <Text
                                style={[styles.optionText, active && styles.optionTextActive]}
                              >
                                Level {level}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </>
                  ) : (
                    <Text style={styles.warning}>
                      ← Chọn danh mục ở bước 1 để hiện danh sách dịch vụ.
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
            <ActionButton
              label="Thêm Capability"
              onPress={addCapability}
              variant="secondary"
            />
          </View>
        ) : null}
        <ActionButton
          label={loading ? "Đang tạo..." : "Tạo người dùng"}
          onPress={() => void handleCreateUser()}
          disabled={loading}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Cập nhật quyền / Khóa tài khoản</Text>
        {selectedUser ? (
          <View style={styles.selectedUserBanner}>
            <Text style={styles.selectedUserName}>{selectedUser.fullName}</Text>
            <Text style={styles.meta}>{selectedUser.email}</Text>
            <View style={styles.tagRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {formatRoleLabel(String(selectedUser.role))}
                </Text>
              </View>
              <View style={[styles.lockBadge, selectedUser.isLocked && styles.lockBadgeLocked]}>
                <Text style={styles.lockBadgeText}>
                  {selectedUser.isLocked ? "Đang khóa" : "Đang mở"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <Text style={styles.hint}>Nhấn vào người dùng trong danh sách bên dưới để chọn</Text>
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
        />

        <Text style={styles.sectionLabel}>Khóa / Mở khóa tài khoản</Text>
        <Text style={styles.meta}>
          {selectedUser
            ? `Trạng thái hiện tại: ${selectedUser.isLocked ? "Đang bị khóa" : "Đang hoạt động"}`
            : "Chọn người dùng để xem trạng thái"}
        </Text>
        <View style={styles.optionRow}>
          <Pressable
            style={[styles.optionChip, !lockFlag && styles.optionChipActive]}
            onPress={() => setLockFlag(false)}
          >
            <Text style={[styles.optionText, !lockFlag && styles.optionTextActive]}>
              Mở khóa
            </Text>
          </Pressable>
          <Pressable
            style={[styles.optionChip, lockFlag && styles.optionChipDanger]}
            onPress={() => setLockFlag(true)}
          >
            <Text style={[styles.optionText, lockFlag && styles.optionTextDanger]}>
              Khóa
            </Text>
          </Pressable>
        </View>
        <ActionButton
          label={loading ? "Đang lưu..." : lockFlag ? "Khóa tài khoản" : "Mở khóa tài khoản"}
          onPress={() => void handleLockState()}
          disabled={loading || !selectedUserId}
          variant={lockFlag ? "danger" : "secondary"}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Danh sách người dùng ({users.length})</Text>
        <Text style={styles.hint}>Nhấn để chọn người dùng cho thao tác bên trên</Text>
        {users.map((user) => (
          <Pressable
            key={user.id}
            style={[styles.userRow, selectedUserId === user.id && styles.userRowSelected]}
            onPress={() => selectUser(user)}
          >
            <View style={styles.userRowHeader}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <View style={[styles.lockBadge, user.isLocked && styles.lockBadgeLocked]}>
                <Text style={styles.lockBadgeText}>
                  {user.isLocked ? "Khóa" : "Mở"}
                </Text>
              </View>
            </View>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>
              Quyền: {formatRoleLabel(String(user.role))} | SĐT: {user.phoneNumber}
            </Text>
            <Text style={[styles.meta, styles.idText]}>Mã: {formatShortId(user.id)}</Text>
          </Pressable>
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
  subCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    backgroundColor: "#fff"
  },
  subTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14
  },
  capabilityCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    backgroundColor: colors.surface
  },
  capabilityTitle: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
  },
  title: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 15
  },
  sectionLabel: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 13,
    marginTop: 4
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: "italic"
  },
  selectedUserBanner: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 10,
    gap: 4
  },
  selectedUserName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 14
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  roleBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2
  },
  roleBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },
  lockBadge: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2
  },
  lockBadgeLocked: {
    backgroundColor: colors.danger
  },
  lockBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700"
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  optionChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff"
  },
  optionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  optionChipDanger: {
    borderColor: colors.danger ?? "#dc3545",
    backgroundColor: "#fff0f0"
  },
  optionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  optionTextActive: {
    color: colors.primary
  },
  optionTextDanger: {
    color: colors.danger ?? "#dc3545"
  },
  userRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    gap: 2,
    backgroundColor: "#fff"
  },
  userRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft
  },
  userRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  userName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13,
    flex: 1
  },
  idText: {
    fontSize: 10,
    color: colors.textMuted,
    opacity: 0.7
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12
  },
  warning: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18
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
