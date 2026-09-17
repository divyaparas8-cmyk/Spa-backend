import bcrypt from 'bcrypt';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config/constants';
import { CreateUserInput, UpdateUserInput, UserResponse } from './users.types';

export class UsersService {
  private formatUser(user: any): UserResponse {
    const roleName = user.role?.name || 'TECHNICIAN';
    const username = user.staffProfile?.phone || user.email?.split('@')[0] || '';
    let specialties: string[] = [];
    if (user.staffProfile?.specialties) {
      if (Array.isArray(user.staffProfile.specialties)) {
        specialties = user.staffProfile.specialties as string[];
      } else if (typeof user.staffProfile.specialties === 'string') {
        try {
          specialties = JSON.parse(user.staffProfile.specialties);
        } catch {
          specialties = [];
        }
      }
      specialties = specialties.map((s) => (s === 'Massage' ? 'Body Massage' : s));
    }

    return {
      id: user.id,
      name: user.staffProfile?.name || user.email.split('@')[0],
      email: user.email,
      username: username,
      role: roleName.toLowerCase(),
      specialties: specialties,
      active: user.isActive,
      phone: user.staffProfile?.phone || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUsers(): Promise<UserResponse[]> {
    const users = await prisma.user.findMany({
      include: {
        role: true,
        staffProfile: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return users.map((u) => this.formatUser(u));
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        staffProfile: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    return this.formatUser(user);
  }

  async createUser(input: CreateUserInput): Promise<UserResponse> {
    const rawPhone = (input.phone || input.username || '').trim();
    const phoneClean = rawPhone.replace(/\s+/g, '');
    const usernameClean = (input.username || input.phone || input.name || '').trim().toLowerCase().replace(/\s+/g, '');
    const emailNormalized = (input.email && input.email.trim())
      ? input.email.trim().toLowerCase()
      : `${usernameClean || 'user' + Date.now()}@gmail.com`;

    // Check if user already exists with this phone or email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailNormalized },
          ...(rawPhone ? [{ staffProfile: { phone: rawPhone } }] : []),
          ...(phoneClean && phoneClean !== rawPhone ? [{ staffProfile: { phone: phoneClean } }] : []),
        ],
      },
    });
    if (existing) {
      throw new AppError('A staff member with this mobile number or email already exists', HTTP_STATUS.CONFLICT);
    }

    const roleUpper = input.role.toUpperCase() as any;
    const roleRecord = await prisma.role.findFirst({
      where: { name: roleUpper },
    });
    if (!roleRecord) {
      throw new AppError(`Invalid role: ${input.role}`, HTTP_STATUS.BAD_REQUEST);
    }

    const passwordToHash = input.password && input.password.trim() ? input.password.trim() : '123456';
    const passwordHash = await bcrypt.hash(passwordToHash, 10);

    const specialtiesJson = (Array.isArray(input.specialties) ? input.specialties : []).map(
      (s: string) => (s === 'Massage' ? 'Body Massage' : s)
    );

    const user = await prisma.user.create({
      data: {
        email: emailNormalized,
        passwordHash,
        roleId: roleRecord.id,
        isActive: true,
        staffProfile: {
          create: {
            name: input.name.trim(),
            phone: rawPhone || null,
            specialties: specialtiesJson,
          },
        },
      },
      include: {
        role: true,
        staffProfile: true,
      },
    });

    return this.formatUser(user);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<UserResponse> {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        staffProfile: true,
      },
    });

    if (!existing) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const userUpdates: any = {};

    if (input.role) {
      const roleUpper = input.role.toUpperCase() as any;
      const roleRecord = await prisma.role.findFirst({
        where: { name: roleUpper },
      });
      if (!roleRecord) {
        throw new AppError(`Invalid role: ${input.role}`, HTTP_STATUS.BAD_REQUEST);
      }
      userUpdates.roleId = roleRecord.id;
    }

    if (input.password && input.password.trim()) {
      userUpdates.passwordHash = await bcrypt.hash(input.password.trim(), 10);
    }

    if (input.active !== undefined) {
      userUpdates.isActive = input.active;
    } else if (input.isActive !== undefined) {
      userUpdates.isActive = input.isActive;
    }

    if (input.email && input.email.trim()) {
      const emailNormalized = input.email.trim().toLowerCase();
      if (emailNormalized !== existing.email) {
        const conflict = await prisma.user.findUnique({ where: { email: emailNormalized } });
        if (conflict) {
          throw new AppError('Email already in use', HTTP_STATUS.CONFLICT);
        }
        userUpdates.email = emailNormalized;
      }
    }

    // Update staffProfile
    const profileUpdates: any = {};
    if (input.name !== undefined && input.name.trim()) {
      profileUpdates.name = input.name.trim();
    }
    if (input.phone !== undefined || input.username !== undefined) {
      const p = input.phone !== undefined ? input.phone : input.username;
      profileUpdates.phone = p ? p.trim() : null;
    }
    if (input.specialties !== undefined) {
      const specs = Array.isArray(input.specialties) ? input.specialties : [];
      profileUpdates.specialties = specs.map((s: string) => (s === 'Massage' ? 'Body Massage' : s));
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userUpdates).length > 0) {
        await tx.user.update({
          where: { id },
          data: userUpdates,
        });
      }

      if (Object.keys(profileUpdates).length > 0) {
        if (existing.staffProfile) {
          await tx.staffProfile.update({
            where: { userId: id },
            data: profileUpdates,
          });
        } else {
          await tx.staffProfile.create({
            data: {
              userId: id,
              name: profileUpdates.name || existing.email.split('@')[0],
              phone: profileUpdates.phone || null,
              specialties: profileUpdates.specialties || [],
            },
          });
        }
      }
    });

    const updated = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        staffProfile: true,
      },
    });

    return this.formatUser(updated!);
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

export const usersService = new UsersService();
