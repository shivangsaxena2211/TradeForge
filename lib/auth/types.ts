export type SessionUser = {
  id: string;
  email: string;
  username: string;
};

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
};
