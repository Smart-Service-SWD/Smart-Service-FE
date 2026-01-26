// Common Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
  role: 'USER' | 'STAFF' | 'AGENT';
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  hasRole: (role: string) => boolean;
  ROLES: {
    USER: 'USER';
    STAFF: 'STAFF';
    AGENT: 'AGENT';
  };
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  phoneNumber?: string;
  role: 'USER' | 'STAFF' | 'AGENT';
}

export interface AnalysisResult {
  id: string;
  imageUri: string;
  imageUrl?: string;
  result: any;
  confidence?: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  category?: string;
  description?: string;
}

export interface AnalysisContextType {
  analysisHistory: AnalysisResult[];
  currentAnalysis: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  analyze: (imageUri: string, metadata?: Record<string, any>) => Promise<AnalysisResult>;
  fetchHistory: (page?: number) => Promise<void>;
  getDetail: (analysisId: string) => Promise<void>;
}

export interface NavigationProps {
  navigation: any;
  route?: any;
}
