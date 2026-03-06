export const STAFF_REQUEST_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  AWAITING_ANALYSIS: { label: 'Chờ phân tích', color: '#9E9E9E' },
  CREATED: { label: 'Mới tạo', color: '#607D8B' },
  PENDING_REVIEW: { label: 'Chờ duyệt', color: '#FF9800' },
  APPROVED: { label: 'Đã duyệt', color: '#4CAF50' },
  ASSIGNED: { label: 'Đã phân công', color: '#2196F3' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: '#3F51B5' },
  COMPLETED: { label: 'Hoàn thành', color: '#4CAF50' },
  CANCELLED: { label: 'Đã hủy', color: '#F44336' },
  URGENT_DISPATCH: { label: 'Khẩn cấp', color: '#E91E63' },
};

export const COMPLEXITY_LABEL: Record<number, string> = {
  1: 'Rất đơn giản',
  2: 'Đơn giản',
  3: 'Trung bình',
  4: 'Phức tạp',
  5: 'Rất phức tạp',
};

export const formatRequestDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
