import { CreateUserInput, UpdateUserInput, UserResponse } from './users.types';
export declare class UsersService {
    private formatUser;
    getUsers(): Promise<UserResponse[]>;
    getUserById(id: string): Promise<UserResponse>;
    createUser(input: CreateUserInput): Promise<UserResponse>;
    updateUser(id: string, input: UpdateUserInput): Promise<UserResponse>;
    deleteUser(id: string): Promise<void>;
}
export declare const usersService: UsersService;
//# sourceMappingURL=users.service.d.ts.map