export type RequestTabType = 'pending' | 'completed';

export interface RequestStatusMeta {
  label: string;
  color: string;
  bg: string;
  dot: string;
}

export const REQUEST_STATUS_MAP: Record<string, RequestStatusMeta> = {
  AWAITING_ANALYSIS: { label: 'Dang phan tich', color: '#FF9500', bg: '#FFF3E0', dot: '#FF9500' },
  CREATED: { label: 'Da tao', color: '#8E8E93', bg: '#F5F6FA', dot: '#8E8E93' },
  PENDING_REVIEW: { label: 'Cho duyet', color: '#007AFF', bg: '#E8F2FF', dot: '#007AFF' },
  APPROVED: { label: 'Da duyet', color: '#5AC8FA', bg: '#E3F5FC', dot: '#5AC8FA' },
  ASSIGNED: { label: 'Da phan cong', color: '#FF9500', bg: '#FFF3E0', dot: '#FF9500' },
  IN_PROGRESS: { label: 'Dang xu ly', color: '#FF6B00', bg: '#FFF0E3', dot: '#FF6B00' },
  URGENT_DISPATCH: { label: 'Khan cap', color: '#FF3B30', bg: '#FFE8E8', dot: '#FF3B30' },
  COMPLETED: { label: 'Hoan thanh', color: '#34C759', bg: '#E6FAF0', dot: '#34C759' },
  CANCELLED: { label: 'Da huy', color: '#9E9E9E', bg: '#F5F5F5', dot: '#9E9E9E' },
};

export const isPendingRequestStatus = (status: string) =>
  status !== 'COMPLETED' && status !== 'CANCELLED';

export const formatAdminRequestDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export const formatAdminRequestCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
