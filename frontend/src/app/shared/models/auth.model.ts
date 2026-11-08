
export interface AuthUser {
  id: number;
  email: string;
  createdAt?: string;
}


export interface AuthCredentials {
  email: string;
  password: string;
}


export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}