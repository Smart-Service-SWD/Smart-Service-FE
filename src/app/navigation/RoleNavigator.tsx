import CustomerTabs from "./CustomerTabs";
import AgentTabs from "./AgentTabs";
import StaffTabs from "./StaffTabs";
import AdminTabs from "./AdminTabs";
import type { AppRole } from "../../shared/types/auth";

interface RoleNavigatorProps {
  role: AppRole;
}

export default function RoleNavigator({ role }: RoleNavigatorProps) {
  switch (role) {
    case "ADMIN":
      return <AdminTabs />;
    case "STAFF":
      return <StaffTabs />;
    case "AGENT":
      return <AgentTabs />;
    default:
      return <CustomerTabs />;
  }
}

