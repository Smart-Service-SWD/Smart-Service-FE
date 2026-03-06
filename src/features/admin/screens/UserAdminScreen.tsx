import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ScreenLayout from "../../../shared/ui/ScreenLayout";
import { colors } from "../../../app/theme/colors";
import { useAuth } from "../../auth/AuthContext";
import { graphqlRequest } from "../../../shared/api/graphqlClient";
import { USERS_QUERY } from "../../../shared/api/graphqlDocuments";
import { asErrorMessage } from "../../../shared/utils/format";
import type { UserProfile } from "../../../shared/types/domain";
import LabeledInput from "../../../shared/ui/LabeledInput";
import ActionButton from "../../../shared/ui/ActionButton";
import {
  createAgentUser,
  createCustomerUser,
  createStaffUser,
  setUserLockState,
  updateUserRole
} from "../api/adminApi";

interface UsersResponse {
  getUsers: UserProfile[];
}

const roleOptions = ["CUSTOMER", "STAFF", "AGENT", "ADMIN"] as const;
const createRoleOptions = ["CUSTOMER", "STAFF", "AGENT"] as const;

const toBackendRole = (role: string): string =>
  role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

export default function UserAdminScreen() {
  const { session } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [targetRole, setTargetRole] = useState<(typeof roleOptions)[number]>("AGENT");
  const [lockFlag, setLockFlag] = useState(true);
  const [newUserRole, setNewUserRole] =
    useState<(typeof createRoleOptions)[number]>("CUSTOMER");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  );

  const loadUsers = async () => {
    if (!session) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await graphqlRequest<UsersResponse>(
        USERS_QUERY,
        undefined,
        session.accessToken
      );
      setUsers(data.getUsers);
    } catch (loadError) {
      setError(asErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

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
        id = await createAgentUser(session.accessToken, {
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim()
        });
      } else {
        id = await createStaffUser(session.accessToken, {
          fullName: fullName.trim(),
          email: email.trim(),
          phoneNumber: phoneNumber.trim()
        });
      }
      setSuccess(`Created ${newUserRole} user: ${id}`);
      setFullName("");
      setEmail("");
      setPhoneNumber("");
      await loadUsers();
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
      await loadUsers();
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
      await loadUsers();
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
  error: {
    color: colors.danger,
    fontSize: 13
  },
  success: {
    color: colors.success,
    fontSize: 13
  }
});

