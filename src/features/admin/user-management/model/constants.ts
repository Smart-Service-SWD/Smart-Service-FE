export const ROLE_OPTIONS = ['all', 'CUSTOMER', 'STAFF', 'AGENT', 'ADMIN'] as const;
export const EDITABLE_ROLE_OPTIONS = ['CUSTOMER', 'STAFF', 'AGENT', 'ADMIN'] as const;

export const getRoleColor = (role: string) => {
  switch (role) {
    case 'CUSTOMER':
      return '#007AFF';
    case 'STAFF':
      return '#34C759';
    case 'AGENT':
      return '#FF9500';
    case 'ADMIN':
      return '#FF3B30';
    default:
      return '#8E8E93';
  }
};

export const getRoleLabel = (role: string) => {
  switch (role) {
    case 'CUSTOMER':
      return 'Khách hàng';
    case 'STAFF':
      return 'Nhân viên';
    case 'AGENT':
      return 'Thợ';
    case 'ADMIN':
      return 'Quản trị';
    default:
      return role;
  }
};
