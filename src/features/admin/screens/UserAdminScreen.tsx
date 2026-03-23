import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../../../app/theme/colors";
import BrandLogo from "../../../shared/ui/BrandLogo";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  SERVICE_AGENTS_QUERY,
  SERVICE_CATEGORIES_QUERY,
  SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
  USERS_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage, formatRoleLabel, formatShortId } from "../../../shared/utils/format";
import type { AgentCapabilityItem, ServiceAgentItem, ServiceCategory, ServiceDefinition, UserProfile } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import {
  type CreateAgentCapabilityPayload,
  createAgentUser,
  createCustomerUser,
  createStaffUser,
  setUserLockState,
  updateAgentCapabilities,
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

interface ServiceAgentsResponse {
  getServiceAgents: ServiceAgentItem[];
}

const roleOptions = ["CUSTOMER", "STAFF", "AGENT", "ADMIN"] as const;
const createRoleOptions = ["CUSTOMER", "STAFF", "AGENT"] as const;

const toBackendRole = (role: string): string =>
  role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

type ActivePanel = "create" | "update" | null;

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
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const toCapabilityDrafts = (capabilities?: AgentCapabilityItem[] | null): CapabilityDraft[] =>
  capabilities?.length
    ? capabilities.map((capability) => ({
        key: capability.id,
        categoryId: capability.categoryId,
        maxComplexityLevel: capability.maxComplexity?.level ?? 3,
        serviceIds: capability.serviceIds ?? []
      }))
    : [createCapabilityDraft()];

export default function UserAdminScreen() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [serviceAgents, setServiceAgents] = useState<ServiceAgentItem[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [servicesByCategory, setServicesByCategory] = useState<Record<string, ServiceDefinition[]>>({});
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetRole, setTargetRole] = useState<(typeof roleOptions)[number]>("CUSTOMER");

  // lockFlag: giá trị sẽ gửi lên backend khi bấm nút
  const [lockFlag, setLockFlag] = useState(false);

  const [newUserRole, setNewUserRole] = useState<(typeof createRoleOptions)[number]>("CUSTOMER");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentCapabilities, setAgentCapabilities] = useState<CapabilityDraft[]>([createCapabilityDraft()]);
  const [loading, setLoading] = useState(false);
  const [loadingServicesForCategory, setLoadingServicesForCategory] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  // ✅ Thu gọn/expand danh sách user
  const [isUserListExpanded, setIsUserListExpanded] = useState(true);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const selectedServiceAgent = useMemo(
    () => (selectedUser ? serviceAgents.find((agent) => agent.userId === selectedUser.id) ?? null : null),
    [selectedUser, serviceAgents]
  );

  const selectedUserRole = String(selectedUser?.role ?? "").toUpperCase();

  const roleSummary = useMemo(
    () => ({
      locked: users.filter((user) => user.isLocked).length,
      staff: users.filter((user) => String(user.role).toUpperCase() === "STAFF").length,
      agents: users.filter((user) => String(user.role).toUpperCase() === "AGENT").length,
      customers: users.filter((user) => String(user.role).toUpperCase() === "CUSTOMER").length
    }),
    [users]
  );

  const togglePanel = (panel: ActivePanel) => {
    setError("");
    setSuccess("");
    if (panel === "create") {
      setAgentCapabilities([createCapabilityDraft()]);
    }
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const selectUser = (user: UserProfile) => {
    setSelectedUserId(user.id);
    setTargetRole((user.role?.toString().toUpperCase() as (typeof roleOptions)[number]) ?? "CUSTOMER");

    // ✅ Set lockFlag thành trạng thái MỚI muốn set (toggle)
    // Nếu user đang locked => lockFlag = false (mở khóa)
    // Nếu user đang mở => lockFlag = true (khóa)
    setLockFlag(!user.isLocked);

    setError("");
    setSuccess("");
    setActivePanel("update");
  };

  const loadUsers = async (token: string) => {
    const data = await graphqlRequest<UsersResponse>(USERS_QUERY, undefined, token);
    setUsers(data.getUsers);
  };

  const loadServiceAgents = async (token: string) => {
    const data = await graphqlRequest<ServiceAgentsResponse>(SERVICE_AGENTS_QUERY, undefined, token);
    setServiceAgents(data.getServiceAgents);
  };

  const loadCategories = async () => {
    const data = await graphqlRequest<CategoriesResponse>(SERVICE_CATEGORIES_QUERY);
    setCategories(data.getServiceCategories);
  };

  const ensureServicesForCategory = async (categoryId: string, forceRefresh = false) => {
    if (!categoryId) return;
    if (!forceRefresh && servicesByCategory[categoryId]?.length) return;
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
    if (!session) return;
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadUsers(session.accessToken), loadServiceAgents(session.accessToken), loadCategories()]);
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


  useEffect(() => {
    if (activePanel !== "update" || selectedUserRole !== "AGENT") return;

    const drafts = toCapabilityDrafts(selectedServiceAgent?.capabilities);
    setAgentCapabilities(drafts);
    drafts.forEach((draft) => {
      if (draft.categoryId) {
        void ensureServicesForCategory(draft.categoryId);
      }
    });
  }, [activePanel, selectedServiceAgent, selectedUserRole]);

  const setCapabilityCategory = (key: string, categoryId: string) => {
    setAgentCapabilities((current) =>
      current.map((item) => (item.key === key ? { ...item, categoryId, serviceIds: [] } : item))
    );
    void ensureServicesForCategory(categoryId);
  };

  const toggleCapabilityService = (key: string, serviceId: string) => {
    setAgentCapabilities((current) =>
      current.map((item) => {
        if (item.key !== key) return item;
        const serviceIds = item.serviceIds.includes(serviceId)
          ? item.serviceIds.filter((id) => id !== serviceId)
          : [...item.serviceIds, serviceId];
        return { ...item, serviceIds };
      })
    );
  };

  const setCapabilityComplexity = (key: string, level: number) => {
    setAgentCapabilities((current) =>
      current.map((item) => (item.key === key ? { ...item, maxComplexityLevel: level } : item))
    );
  };

  const addCapability = () => {
    setAgentCapabilities((current) => [...current, createCapabilityDraft()]);
  };

  const removeCapability = (key: string) => {
    setAgentCapabilities((current) => (current.length === 1 ? current : current.filter((item) => item.key !== key)));
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
          !item.categoryId || item.maxComplexityLevel < 1 || item.maxComplexityLevel > 5 || item.serviceIds.length === 0
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

  const isDuplicateEmail = (inputEmail: string): boolean => {
    const normalized = inputEmail.trim().toLowerCase();
    if (!normalized) return false;
    return users.some((u) => (u.email ?? "").trim().toLowerCase() === normalized);
  };

  const handleCreateUser = async () => {
    if (!session) return;
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim()) {
      setError("Họ tên, email và số điện thoại là bắt buộc");
      return;
    }
    if (isDuplicateEmail(email)) {
      setError(`Tài khoản đã tồn tại với email: ${email.trim()}. Vui lòng dùng email khác.`);
      return;
    }

    let agentCapabilitiesPayload: CreateAgentCapabilityPayload[] | null = null;
    if (newUserRole === "AGENT") {
      agentCapabilitiesPayload = buildAgentCapabilities();
      if (!agentCapabilitiesPayload) return;
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

      await Promise.all([loadUsers(session.accessToken), loadServiceAgents(session.accessToken)]);
    } catch (createError) {
      setError(asErrorMessage(createError));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAgentCapabilities = async () => {
    if (!session) return;
    if (!selectedServiceAgent) {
      setError("Không tìm thấy hồ sơ ServiceAgent để cập nhật capability.");
      return;
    }

    const payload = buildAgentCapabilities();
    if (!payload) return;

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await updateAgentCapabilities(session.accessToken, selectedServiceAgent.id, {
        capabilities: payload
      });
      setSuccess("Đã cập nhật hồ sơ nghề của thợ.");
      await Promise.all([loadUsers(session.accessToken), loadServiceAgents(session.accessToken)]);
    } catch (updateError) {
      setError(asErrorMessage(updateError));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!session) return;
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
      await Promise.all([loadUsers(session.accessToken), loadServiceAgents(session.accessToken)]);
    } catch (updateError) {
      setError(asErrorMessage(updateError));
    } finally {
      setLoading(false);
    }
  };

  const handleLockState = async () => {
    if (!session) return;
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
      await Promise.all([loadUsers(session.accessToken), loadServiceAgents(session.accessToken)]);

      // sau khi thao tác, đảo lockFlag để lần bấm sau là thao tác ngược lại
      setLockFlag((prev) => !prev);
    } catch (lockError) {
      setError(asErrorMessage(lockError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <BrandLogo size={40} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Quản lý người dùng</Text>
              <Text style={styles.headerSub}>Tạo, đổi quyền và quản lý tài khoản</Text>
            </View>
          </View>
        </View>

        {/* Alerts */}
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

        {/* Overview */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tổng quan người dùng</Text>
          <View style={styles.metricGrid}>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{users.length}</Text>
              <Text style={styles.countLabel}>Tổng</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{roleSummary.staff}</Text>
              <Text style={styles.countLabel}>Staff</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{roleSummary.agents}</Text>
              <Text style={styles.countLabel}>Agent</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countNumber}>{roleSummary.locked}</Text>
              <Text style={styles.countLabel}>Đang khóa</Text>
            </View>
          </View>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.loadingText}>Đang đồng bộ...</Text>
            </View>
          ) : null}
        </View>

        {/* Toggle buttons */}
        <View style={styles.toggleRow}>
          <Pressable
            style={[styles.toggleBtn, activePanel === "create" && styles.toggleBtnActive]}
            onPress={() => togglePanel("create")}
          >
            <MaterialIcons name="person-add" size={18} color={activePanel === "create" ? "#fff" : "#0f172a"} />
            <Text style={[styles.toggleBtnText, activePanel === "create" && styles.toggleBtnTextActive]}>
              Tạo người dùng
            </Text>
          </Pressable>

          <Pressable
            style={[styles.toggleBtn, activePanel === "update" && styles.toggleBtnActive]}
            onPress={() => togglePanel("update")}
          >
            <MaterialIcons name="manage-accounts" size={18} color={activePanel === "update" ? "#fff" : "#0f172a"} />
            <Text style={[styles.toggleBtnText, activePanel === "update" && styles.toggleBtnTextActive]}>
              Cập nhật người dùng
            </Text>
          </Pressable>
        </View>

        {/* Create user */}
        {activePanel === "create" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tạo người dùng mới</Text>

            <View style={styles.chipRow}>
              {createRoleOptions.map((role) => {
                const active = newUserRole === role;
                return (
                  <Pressable key={role} style={[styles.chip, active && styles.chipActive]} onPress={() => setNewUserRole(role)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatRoleLabel(role)}</Text>
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
            <LabeledInput label="Số điện thoại" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

            {newUserRole === "AGENT" ? (
              <View style={styles.subCard}>
                <Text style={styles.subTitle}>Capability của thợ</Text>
                <Text style={styles.metaText}>
                  Mỗi capability nên đại diện cho một danh mục, nhiều dịch vụ và một mức độ phức tạp tối đa.
                </Text>

                {agentCapabilities.map((capability, index) => {
                  const isLoadingServices = loadingServicesForCategory === capability.categoryId;
                  const services = capability.categoryId ? servicesByCategory[capability.categoryId] ?? [] : [];
                  const hasCategory = !!capability.categoryId;
                  const hasServices = capability.serviceIds.length > 0;

                  return (
                    <View key={capability.key} style={styles.capabilityCard}>
                      <View style={styles.capabilityHeader}>
                        <Text style={styles.capabilityTitle}>Capability #{index + 1}</Text>
                        <View style={[styles.statusPill, { backgroundColor: hasServices ? "#f0fdf4" : "#fefce8" }]}>
                          <Text style={[styles.statusText, { color: hasServices ? "#16a34a" : "#ca8a04" }]}>
                            {hasServices ? `${capability.serviceIds.length} dịch vụ` : "Chưa chọn"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.sectionLabel}>1. Chọn danh mục</Text>
                      <View style={styles.chipRow}>
                        {categories.map((category) => {
                          const active = capability.categoryId === category.id;
                          return (
                            <Pressable
                              key={`${capability.key}-${category.id}`}
                              style={[styles.chip, active && styles.chipActive]}
                              onPress={() => setCapabilityCategory(capability.key, category.id)}
                            >
                              <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
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
                            <Text style={styles.metaText}>Đang tải dịch vụ...</Text>
                          ) : services.length === 0 ? (
                            <Text style={styles.warningText}>
                              Danh mục này chưa có dịch vụ nào. Hãy thêm dịch vụ trong màn Quản lý dịch vụ trước.
                            </Text>
                          ) : (
                            <View style={styles.chipRow}>
                              {services.map((service) => {
                                const active = capability.serviceIds.includes(service.id);
                                return (
                                  <Pressable
                                    key={`${capability.key}-${service.id}`}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => toggleCapabilityService(capability.key, service.id)}
                                  >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                      {service.name}
                                      {service.complexityRange?.length === 2
                                        ? ` • ${service.complexityRange[0]}-${service.complexityRange[1]}`
                                        : ""}
                                      {service.isDangerous ? " • Cảnh báo" : ""}
                                    </Text>
                                  </Pressable>
                                );
                              })}
                            </View>
                          )}

                          <Text style={styles.sectionLabel}>3. Mức độ phức tạp tối đa</Text>
                          <View style={styles.chipRow}>
                            {[1, 2, 3, 4, 5].map((level) => {
                              const active = capability.maxComplexityLevel === level;
                              return (
                                <Pressable
                                  key={`${capability.key}-level-${level}`}
                                  style={[styles.chip, active && styles.chipActive]}
                                  onPress={() => setCapabilityComplexity(capability.key, level)}
                                >
                                  <Text style={[styles.chipText, active && styles.chipTextActive]}>Level {level}</Text>
                                </Pressable>
                              );
                            })}
                          </View>
                        </>
                      ) : (
                        <Text style={styles.warningText}>Chọn danh mục để hệ thống nạp danh sách dịch vụ tương ứng.</Text>
                      )}

                      {agentCapabilities.length > 1 ? (
                        <ActionButton label="Xóa capability này" onPress={() => removeCapability(capability.key)} variant="danger" />
                      ) : null}
                    </View>
                  );
                })}

                <ActionButton label="Thêm Capability" onPress={addCapability} variant="secondary" />
              </View>
            ) : null}

            <ActionButton label={loading ? "Đang tạo..." : "Tạo người dùng"} onPress={() => void handleCreateUser()} disabled={loading} />
          </View>
        )}

        {/* Update user */}
        {activePanel === "update" && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cập nhật quyền và trạng thái khóa</Text>

            {selectedUser ? (
              <View style={styles.selectedUserBanner}>
                <View style={styles.selectedUserIdentity}>
                  <View style={styles.selectedAvatar}>
                    <Text style={styles.selectedAvatarText}>{getUserInitials(selectedUser.fullName)}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.selectedUserName}>{selectedUser.fullName}</Text>
                    <Text style={styles.metaText}>{selectedUser.email}</Text>
                  </View>
                </View>

                <View style={styles.badgeRow}>
                  <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                    <Text style={[styles.statusText, { color: "#2563eb" }]}>{formatRoleLabel(String(selectedUser.role))}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: selectedUser.isLocked ? "#fef2f2" : "#f0fdf4" }]}>
                    <Text style={[styles.statusText, { color: selectedUser.isLocked ? "#dc2626" : "#16a34a" }]}>
                      {selectedUser.isLocked ? "Đang khóa" : "Đang hoạt động"}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <Text style={styles.hintText}>Chưa chọn người dùng. Hãy nhấn vào một dòng trong danh sách người dùng.</Text>
            )}
            {selectedUserRole === "AGENT" ? (
              <View style={styles.subCard}>
                <Text style={styles.subTitle}>Hồ sơ nghề của thợ</Text>
                <Text style={styles.metaText}>
                  Chỉnh danh mục, dịch vụ và mức độ phức tạp tối đa rồi lưu để cập nhật capability cho thợ.
                </Text>

                {selectedServiceAgent ? (
                  <>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: selectedServiceAgent.isActive ? "#f0fdf4" : "#fef2f2" }
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: selectedServiceAgent.isActive ? "#16a34a" : "#dc2626" }
                          ]}
                        >
                          {selectedServiceAgent.isActive ? "Đang nhận việc" : "Tạm ngưng nhận việc"}
                        </Text>
                      </View>
                      <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}> 
                        <Text style={[styles.statusText, { color: "#2563eb" }]}>
                          {agentCapabilities.length} capability
                        </Text>
                      </View>
                    </View>

                    {agentCapabilities.map((capability, index) => {
                      const isLoadingServices = loadingServicesForCategory === capability.categoryId;
                      const services = capability.categoryId ? servicesByCategory[capability.categoryId] ?? [] : [];
                      const hasCategory = !!capability.categoryId;
                      const hasServices = capability.serviceIds.length > 0;

                      return (
                        <View key={capability.key} style={styles.capabilityCard}>
                          <View style={styles.capabilityHeader}>
                            <Text style={styles.capabilityTitle}>Capability #{index + 1}</Text>
                            <View style={[styles.statusPill, { backgroundColor: hasServices ? "#f0fdf4" : "#fefce8" }]}> 
                              <Text style={[styles.statusText, { color: hasServices ? "#16a34a" : "#ca8a04" }]}>
                                {hasServices ? `${capability.serviceIds.length} dịch vụ` : "Chưa chọn"}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.sectionLabel}>1. Chọn danh mục</Text>
                          <View style={styles.chipRow}>
                            {categories.map((category) => {
                              const active = capability.categoryId === category.id;
                              return (
                                <Pressable
                                  key={`${capability.key}-${category.id}`}
                                  style={[styles.chip, active && styles.chipActive]}
                                  onPress={() => setCapabilityCategory(capability.key, category.id)}
                                >
                                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{category.name}</Text>
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
                                <Text style={styles.metaText}>Đang tải dịch vụ...</Text>
                              ) : services.length === 0 ? (
                                <Text style={styles.warningText}>
                                  Danh mục này chưa có dịch vụ nào. Hãy thêm dịch vụ trong màn Quản lý dịch vụ trước.
                                </Text>
                              ) : (
                                <View style={styles.chipRow}>
                                  {services.map((service) => {
                                    const active = capability.serviceIds.includes(service.id);
                                    return (
                                      <Pressable
                                        key={`${capability.key}-${service.id}`}
                                        style={[styles.chip, active && styles.chipActive]}
                                        onPress={() => toggleCapabilityService(capability.key, service.id)}
                                      >
                                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                                          {service.name}
                                          {service.complexityRange?.length === 2
                                            ? ` • ${service.complexityRange[0]}-${service.complexityRange[1]}`
                                            : ""}
                                          {service.isDangerous ? " • Cảnh báo" : ""}
                                        </Text>
                                      </Pressable>
                                    );
                                  })}
                                </View>
                              )}

                              <Text style={styles.sectionLabel}>3. Mức độ phức tạp tối đa</Text>
                              <View style={styles.chipRow}>
                                {[1, 2, 3, 4, 5].map((level) => {
                                  const active = capability.maxComplexityLevel === level;
                                  return (
                                    <Pressable
                                      key={`${capability.key}-level-${level}`}
                                      style={[styles.chip, active && styles.chipActive]}
                                      onPress={() => setCapabilityComplexity(capability.key, level)}
                                    >
                                      <Text style={[styles.chipText, active && styles.chipTextActive]}>Level {level}</Text>
                                    </Pressable>
                                  );
                                })}
                              </View>
                            </>
                          ) : (
                            <Text style={styles.warningText}>Chọn danh mục để hệ thống nạp danh sách dịch vụ tương ứng.</Text>
                          )}

                          {agentCapabilities.length > 1 ? (
                            <ActionButton label="Xóa capability này" onPress={() => removeCapability(capability.key)} variant="danger" />
                          ) : null}
                        </View>
                      );
                    })}

                    <ActionButton label="Thêm Capability" onPress={addCapability} variant="secondary" />
                    <ActionButton
                      label={loading ? "Đang lưu hồ sơ..." : "Lưu hồ sơ nghề"}
                      onPress={() => void handleUpdateAgentCapabilities()}
                      disabled={loading || !selectedServiceAgent}
                    />
                  </>
                ) : (
                  <Text style={styles.warningText}>
                    User đang mang role thợ nhưng FE chưa tìm thấy hồ sơ ServiceAgent được liên kết bằng userId.
                  </Text>
                )}
              </View>
            ) : null}

            <Text style={styles.sectionLabel}>Đổi quyền sang</Text>
            <View style={styles.chipRow}>
              {roleOptions.map((role) => {
                const active = targetRole === role;
                return (
                  <Pressable key={role} style={[styles.chip, active && styles.chipActive]} onPress={() => setTargetRole(role)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatRoleLabel(role)}</Text>
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

            {/* ✅ Chỉ hiện 1 nút khóa hoặc mở khóa */}
            <Text style={styles.sectionLabel}>Khóa hoặc mở khóa tài khoản</Text>
            <Text style={styles.metaText}>
              {selectedUser
                ? `Trạng thái hiện tại: ${selectedUser.isLocked ? "Đang bị khóa" : "Đang hoạt động"}`
                : "Chọn người dùng đ�� xem trạng thái hiện tại"}
            </Text>

            {selectedUser ? (
              <ActionButton
                label={loading ? "Đang lưu..." : selectedUser.isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
                onPress={() => {
                  // set lockFlag đúng với hành động mong muốn trước khi gọi
                  setLockFlag(!selectedUser.isLocked);
                  void handleLockState();
                }}
                disabled={loading || !selectedUserId}
                variant={selectedUser.isLocked ? "secondary" : "danger"}
              />
            ) : (
              <ActionButton
                label="Chọn người dùng để thao tác khóa/mở khóa"
                onPress={() => {}}
                disabled
                variant="secondary"
              />
            )}
          </View>
        )}

        {/* User list (collapsible) */}
        <View style={styles.card}>
          {/* Header của list: chỉ bấm vào đây mới đóng/mở */}
          <Pressable style={styles.userListHeader} onPress={() => setIsUserListExpanded((prev) => !prev)}>
            <Text style={styles.cardTitle}>Danh sách người dùng ({users.length})</Text>
            <MaterialIcons
              name={isUserListExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
              size={22}
              color="#0f172a"
            />
          </Pressable>

          {isUserListExpanded ? (
            <View style={{ gap: 10 }}>
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
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={styles.userName}>{user.fullName}</Text>
                        <Text style={styles.metaText}>{user.email}</Text>
                      </View>
                    </View>

                    <View style={[styles.statusPill, { backgroundColor: user.isLocked ? "#fef2f2" : "#f0fdf4" }]}>
                      <Text style={[styles.statusText, { color: user.isLocked ? "#dc2626" : "#16a34a" }]}>
                        {user.isLocked ? "Khóa" : "Mở"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    <View style={[styles.statusPill, { backgroundColor: "#eff6ff" }]}>
                      <Text style={[styles.statusText, { color: "#2563eb" }]}>{formatRoleLabel(String(user.role))}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: "#f0f4ff" }]}>
                      <Text style={[styles.statusText, { color: "#64748b" }]}>SĐT {user.phoneNumber || "-"}</Text>
                    </View>
                  </View>

                  <Text style={[styles.metaText, { fontSize: 11, opacity: 0.75 }]}>Mã: {formatShortId(user.id)}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.hintText}>Nhấn tiêu đề để mở danh sách người dùng.</Text>
          )}
        </View>

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

  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  countBadge: {
    flex: 1,
    minWidth: "20%",
    backgroundColor: "#f0f4ff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  countNumber: { fontSize: 20, fontWeight: "800", color: colors.text },
  countLabel: { fontSize: 11, color: "#64748b", marginTop: 2 },

  toggleRow: { flexDirection: "row", gap: 10, marginHorizontal: 20 },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  toggleBtnText: { fontSize: 13, fontWeight: "800", color: "#0f172a" },
  toggleBtnTextActive: { color: "#fff" },

  sectionLabel: { color: "#0f172a", fontWeight: "700", fontSize: 13, marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#f0f4ff"
  },
  chipActive: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  chipDanger: { borderColor: colors.danger, backgroundColor: "#fef2f2" },
  chipText: { color: "#64748b", fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: colors.primary },
  chipTextDanger: { color: colors.danger },

  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },
  metaText: { fontSize: 12, color: "#64748b" },
  hintText: { color: "#94a3b8", fontSize: 12, lineHeight: 18 },
  warningText: { color: "#ca8a04", fontSize: 12, lineHeight: 18 },

  subCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    backgroundColor: "#f0f4ff"
  },
  subTitle: { color: "#0f172a", fontWeight: "800", fontSize: 14 },
  capabilityCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 10,
    backgroundColor: "#fff"
  },
  capabilityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  capabilityTitle: { color: "#0f172a", fontWeight: "800", fontSize: 13 },

  selectedUserBanner: {
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#eff6ff"
  },
  selectedUserIdentity: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  selectedAvatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  selectedUserName: { color: "#0f172a", fontWeight: "800", fontSize: 15 },

  userListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },

  userRow: {
    backgroundColor: "#f0f4ff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 8
  },
  userRowSelected: { borderColor: colors.primary, backgroundColor: "#eff6ff" },
  userRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  userIdentity: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center"
  },
  userAvatarText: { color: "#2563eb", fontSize: 15, fontWeight: "800" },
  userName: { color: "#0f172a", fontWeight: "800", fontSize: 14 }
});

