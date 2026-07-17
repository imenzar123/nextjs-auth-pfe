export type Role = 'admin' | 'user' | 'operator';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
}
