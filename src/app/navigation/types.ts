export type AuthStackParamList = {
  Login:
    | {
        notice?: string;
      }
    | undefined;
  Register: undefined;
  ForgotPassword:
    | {
        email?: string;
      }
    | undefined;
  ResetPassword: {
    email?: string;
  } | undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  CreateRequest: undefined;
  MyRequests: undefined;
  Feedback: { requestId?: string } | undefined;
  Profile: undefined;
};

export type AgentTabParamList = {
  Assignments: undefined;
  RequestBoard: undefined;
  Profile: undefined;
};

export type StaffTabParamList = {
  ReviewQueue: undefined;
  DispatchCenter: { requestId?: string } | undefined;
  ActivityMonitor: { requestId?: string } | undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Services: undefined;
  Profile: undefined;
};
