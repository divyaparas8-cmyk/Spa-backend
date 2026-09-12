export interface CreateUserInput {
  name: string;
  email?: string;
  username?: string;
  role: string;
  password?: string;
  specialties?: string[];
}

export interface UpdateUserInput {
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  password?: string;
  specialties?: string[];
  active?: boolean;
  isActive?: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  specialties: string[];
  active: boolean;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
