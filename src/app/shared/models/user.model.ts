export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  is_admin?: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  username: string;
  is_admin: boolean;
}
