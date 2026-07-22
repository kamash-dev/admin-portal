export type AdminType = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export type signInResponseType = {
  message: string;
  token: string;
  admin: AdminType;
  error?: string;
}