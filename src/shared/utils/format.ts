import { ApiError } from "../api/httpClient";

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
  if (error instanceof ApiError) {
    const normalizedMessage = error.message.toLowerCase();

    if (
      normalizedMessage.includes("valueobjects.money") ||
      normalizedMessage.includes("$.estimatedcost")
    ) {
      return "Hệ thống đang lỗi khi nhận chi phí ước tính. Hãy cập nhật/restart BE rồi thử phân công lại.";
    }

    if (
      normalizedMessage.includes("before staff confirms its complexity") ||
      normalizedMessage.includes("before staff confirms complexity")
    ) {
      return "Yêu cầu này không còn hủy được vì staff đã xác nhận độ phức tạp hoặc đã chuyển sang bước xử lý tiếp theo.";
    }

    if (error.errorCode === "AUTH_401_INVALID_CREDENTIALS") {
      return "Email hoặc mật khẩu không đúng.";
    }

    if (error.errorCode === "AUTH_409_EMAIL_EXISTS") {
      return "Email này đã được đăng ký.";
    }

    if (error.errorCode === "AUTH_401_UNAUTHORIZED") {
      if (normalizedMessage.includes("locked")) {
        return "Tài khoản này đã bị khóa bởi quản trị viên.";
      }

      if (normalizedMessage.includes("otp")) {
        return "OTP không hợp lệ hoặc đã hết hạn. Hãy yêu cầu mã mới.";
      }

      if (normalizedMessage.includes("refresh token")) {
        return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      }
    }

    if (error.errorCode === "USER_404_NOT_FOUND") {
      return "Không tìm thấy tài khoản này.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }
  return "Đã xảy ra lỗi không mong muốn";
};

export const normalizeRequestStatus = (status?: string | null): string | null => {
  if (!status) {
    return status ?? null;
  }

  return status === "URGENT_DISPATCH" ? "CREATED" : status;
};

export const normalizeServiceRequest = <T extends { status: string }>(item: T): T => {
  const normalizedStatus = normalizeRequestStatus(item.status);

  if (!normalizedStatus || normalizedStatus === item.status) {
    return item;
  }

  return {
    ...item,
    status: normalizedStatus
  };
};

export const normalizeServiceRequests = <T extends { status: string }>(items: T[]): T[] =>
  items.map(normalizeServiceRequest);

const requestStatusLabels: Record<string, string> = {
  AWAITING_ANALYSIS: "Chờ AI",
  CREATED: "Mới tạo",
  PENDING_REVIEW: "Chờ gán thợ",
  AWAITING_DEPOSIT: "Chờ cọc",
  DEPOSIT_PAID: "Đã cọc",
  ASSIGNED: "Đã gán",
  IN_PROGRESS: "Đang làm",
  AWAITING_COMPLETION_REVIEW: "Báo cáo hoàn thành",
  COMPLETION_APPROVED: "Đã duyệt HT",
  AWAITING_FINAL_PAYMENT: "Chờ trả hết",
  FINAL_PAYMENT_PAID: "Đã trả đủ",
  PAYOUT_COMPLETED: "Đã tất toán",
  CANCELLED: "Đã hủy"
};

const roleLabels: Record<string, string> = {
  CUSTOMER: "Khách hàng",
  AGENT: "Kỹ thuật viên",
  STAFF: "Nhân viên điều phối",
  ADMIN: "Quản trị viên"
};

export const formatRequestStatus = (status?: string | null): string => {
  const normalizedStatus = normalizeRequestStatus(status);

  if (!normalizedStatus) {
    return "-";
  }

  return requestStatusLabels[normalizedStatus] ?? normalizedStatus;
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

export const formatShortId = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  if (value.length <= 12) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
};



