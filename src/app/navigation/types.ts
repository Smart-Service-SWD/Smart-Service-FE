export type AuthStackParamList = {
  Login:
    | {
        notice?: string;
      }
    | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: {
    email?: string;
  } | undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  CreateRequest: undefined;
  MyRequests: undefined;
  Feedback: undefined;
  Profile: undefined;
};

export type AgentTabParamList = {
  Assignments: undefined;
  RequestBoard: undefined;
  Profile: undefined;
};

export type StaffTabParamList = {
  ReviewQueue: undefined;
  DispatchCenter: undefined;
  ActivityMonitor: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Users: undefined;
  Services: undefined;
  Profile: undefined;
};
