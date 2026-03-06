export const COMPLEXITY_LABEL: Record<number, string> = {
  1: 'Rat don gian',
  2: 'Don gian',
  3: 'Trung binh',
  4: 'Phuc tap',
  5: 'Rat phuc tap',
};

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
