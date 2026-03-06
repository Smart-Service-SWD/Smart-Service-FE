export type FilterStatus =
  | ''
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export const REQUEST_FILTER_TABS: { label: string; value: FilterStatus }[] = [
  { label: 'Tat ca', value: '' },
  { label: 'Cho duyet', value: 'PENDING_REVIEW' },
  { label: 'Dang lam', value: 'IN_PROGRESS' },
  { label: 'Hoan thanh', value: 'COMPLETED' },
  { label: 'Da huy', value: 'CANCELLED' },
];
