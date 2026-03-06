export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
};

export const formatCurrency = (
  amount: number,
  currency: string = "VND"
): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);

export const asErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Đã xảy ra lỗi không mong muốn";
};

const requestStatusLabels: Record<string, string> = {
  AWAITING_ANALYSIS: "Chờ AI phân tích",
  CREATED: "Mới tạo",
  URGENT_DISPATCH: "Điều phối khẩn",
  PENDING_REVIEW: "Chờ duyệt",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang thực hiện",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy"
};

const roleLabels: Record<string, string> = {
  CUSTOMER: "Khách hàng",
  AGENT: "Kỹ thuật viên",
  STAFF: "Nhân viên điều phối",
  ADMIN: "Quản trị viên"
};

export const formatRequestStatus = (status?: string | null): string => {
  if (!status) {
    return "-";
  }

  return requestStatusLabels[status] ?? status;
};

export const formatRoleLabel = (role?: string | null): string => {
  if (!role) {
    return "-";
  }

  return roleLabels[role] ?? role;
};

export const formatBooleanLabel = (
  value: boolean,
  truthyLabel: string = "Có",
  falsyLabel: string = "Không"
): string => (value ? truthyLabel : falsyLabel);
