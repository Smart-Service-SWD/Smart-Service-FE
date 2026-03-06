export const RE_EVALUATION_STATUS_TAG: Record<string, { label: string; color: string }> = {
  AWAITING_ANALYSIS: { label: 'Cho phan tich', color: '#9E9E9E' },
  CREATED: { label: 'Moi tao', color: '#607D8B' },
};

export const RE_EVALUATION_COMPLEXITY_LABEL: Record<number, string> = {
  1: 'Rat don gian',
  2: 'Don gian',
  3: 'Trung binh',
  4: 'Phuc tap',
  5: 'Rat phuc tap',
};

export const formatReEvaluationDate = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
