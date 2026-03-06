export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  bookingCount: number;
}

export interface ServiceForm {
  name: string;
  description: string;
  categoryId: string;
  basePrice: string;
  estimatedDuration: string;
  isActive: boolean;
}

export const EMPTY_FORM: ServiceForm = {
  name: '',
  description: '',
  categoryId: '',
  basePrice: '',
  estimatedDuration: '',
  isActive: true,
};
