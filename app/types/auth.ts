export type AdminType = {
  id: string;
  email: string;
  name: string;
}

export type signInResponseType = {
  message: string;
  token: string;
  admin: AdminType;
  error?: string;
}