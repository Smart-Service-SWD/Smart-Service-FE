import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import {
  SERVICE_CATEGORIES_QUERY,
  SERVICE_DEFINITIONS_BY_CATEGORY_QUERY,
  USERS_QUERY
} from "../../../shared/api/graphqlDocuments";
import { asErrorMessage } from "../../../shared/utils/format";
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
  const [targetRole, setTargetRole] = useState<(typeof roleOptions)[number]>("AGENT");
  const [lockFlag, setLockFlag] = useState(true);
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

  const loadUsers = async (token: string) => {
    const data = await graphqlRequest<UsersResponse>(USERS_QUERY, undefined, token);
    setUsers(data.getUsers);
  };

  const loadCategories = async () => {
    const data = await graphqlRequest<CategoriesResponse>(SERVICE_CATEGORIES_QUERY);
    setCategories(data.getServiceCategories);
  };

  const ensureServicesForCategory = async (categoryId: string) => {
    if (!categoryId || servicesByCategory[categoryId]) {
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
        [categoryId]: data.getServiceDefinitionsByCategory
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
      setError("Full name, email and phone are required");
      return;
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
      } else if (newUserRole === "AGENT") {
        const capabilities = buildAgentCapabilities();
        if (!capabilities) {
          return;
        }
        id = await createAgentUser(session.accessToken, {
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim(),
          capabilities
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
          ? `Đã tạo thợ thành công: ${id}. BE sẽ tự tạo ServiceAgent và gửi mật khẩu tạm qua email.`
          : `Created ${newUserRole} user: ${id}`
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
      setError("Select user first");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await updateUserRole(session.accessToken, selectedUserId.trim(), {
        role: toBackendRole(targetRole)
      });
      setSuccess("User role updated");
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
      setError("Select user first");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await setUserLockState(session.accessToken, selectedUserId.trim(), {
        isLocked: lockFlag
      });
      setSuccess(lockFlag ? "User locked" : "User unlocked");
      await loadUsers(session.accessToken);
    } catch (lockError) {
      setError(asErrorMessage(lockError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout title="User Admin" subtitle="Manage users / role / lock state">
      {!!error ? <Text style={styles.error}>{error}</Text> : null}
      {!!success ? <Text style={styles.success}>{success}</Text> : null}
      {loading ? <Text style={styles.meta}>Loading...</Text> : null}

      <View style={styles.card}>
        <Text style={styles.title}>Create User</Text>
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
                  {role}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <LabeledInput label="Full Name" value={fullName} onChangeText={setFullName} />
        <LabeledInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <LabeledInput
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />
        {newUserRole === "AGENT" ? (
          <View style={styles.subCard}>
            <Text style={styles.subTitle}>Agent Capabilities</Text>
            <Text style={styles.meta}>
              Theo BE mới, tạo thợ sẽ đồng thời tạo `User` + `ServiceAgent` + danh sách
              `capabilities`.
            </Text>
            {agentCapabilities.map((capability, index) => {
              const services = capability.categoryId
                ? servicesByCategory[capability.categoryId] ?? []
                : [];

              return (
                <View key={capability.key} style={styles.capabilityCard}>
                  <Text style={styles.capabilityTitle}>Capability #{index + 1}</Text>
                  <Text style={styles.meta}>1 danh mục, nhiều dịch vụ, 1 mức độ tối đa.</Text>

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

                  {capability.categoryId ? (
                    <>
                      <Text style={styles.meta}>
                        {loadingServicesForCategory === capability.categoryId
                          ? "Đang tải dịch vụ..."
                          : "Chọn các dịch vụ thợ được phép xử lý"}
                      </Text>
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
                              </Text>
                            </Pressable>
                          );
                        })}
                        {!services.length && loadingServicesForCategory !== capability.categoryId ? (
                          <Text style={styles.warning}>
                            Danh mục này chưa có service definition để gán.
                          </Text>
                        ) : null}
                      </View>

                      <Text style={styles.meta}>Mức độ phức tạp tối đa</Text>
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
                    <Text style={styles.warning}>Chọn danh mục trước để tải danh sách dịch vụ.</Text>
                  )}

                  {agentCapabilities.length > 1 ? (
                    <ActionButton
                      label="Remove Capability"
                      onPress={() => removeCapability(capability.key)}
                      variant="danger"
                    />
                  ) : null}
                </View>
              );
            })}
            <ActionButton
              label="Add Capability"
              onPress={addCapability}
              variant="secondary"
            />
          </View>
        ) : null}
        <ActionButton
          label={loading ? "Creating..." : "Create User"}
          onPress={() => void handleCreateUser()}
          disabled={loading}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Update Role / Lock</Text>
        <LabeledInput
          label="Selected User ID"
          value={selectedUserId}
          onChangeText={setSelectedUserId}
          autoCapitalize="none"
          placeholder="Tap user below to auto-fill"
        />
        <Text style={styles.meta}>
          Selected: {selectedUser ? `${selectedUser.fullName} (${selectedUser.role})` : "-"}
        </Text>
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
                  {role}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <ActionButton
          label={loading ? "Updating..." : "Update Role"}
          onPress={() => void handleUpdateRole()}
          disabled={loading}
        />

        <View style={styles.lockRow}>
          <ActionButton
            label={lockFlag ? "Lock Mode: ON" : "Lock Mode: OFF"}
            onPress={() => setLockFlag((prev) => !prev)}
            variant="secondary"
          />
        </View>
        <ActionButton
          label={loading ? "Saving..." : lockFlag ? "Lock User" : "Unlock User"}
          onPress={() => void handleLockState()}
          disabled={loading}
          variant={lockFlag ? "danger" : "secondary"}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Users ({users.length})</Text>
        {users.map((user) => (
          <Pressable
            key={user.id}
            style={[styles.userRow, selectedUserId === user.id && styles.userRowSelected]}
            onPress={() => setSelectedUserId(user.id)}
          >
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.meta}>{user.email}</Text>
            <Text style={styles.meta}>
              Role: {String(user.role)} | Locked: {user.isLocked ? "Yes" : "No"}
            </Text>
            <Text style={styles.meta}>ID: {user.id}</Text>
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
  optionText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700"
  },
  optionTextActive: {
    color: colors.primary
  },
  lockRow: {
    marginTop: 4
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
  userName: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 13
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
