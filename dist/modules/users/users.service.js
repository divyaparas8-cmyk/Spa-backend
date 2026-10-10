"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersService = exports.UsersService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
class UsersService {
    formatUser(user) {
        const roleName = user.role?.name || 'TECHNICIAN';
        const email = user.email || '';
        const phone = user.phone || user.staffProfile?.phone || null;
        const username = email.split('@')[0];
        let specialties = [];
        if (user.staffProfile?.specialties) {
            if (Array.isArray(user.staffProfile.specialties)) {
                specialties = user.staffProfile.specialties;
            }
            else if (typeof user.staffProfile.specialties === 'string') {
                try {
                    specialties = JSON.parse(user.staffProfile.specialties);
                }
                catch {
                    specialties = [];
                }
            }
            specialties = specialties.map((s) => (s === 'Massage' ? 'Body Massage' : s));
        }
        return {
            id: user.id,
            name: user.staffProfile?.name || email.split('@')[0],
            email: email,
            phone: phone,
            username: username,
            role: roleName.toLowerCase(),
            specialties: specialties,
            active: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
    async getUsers() {
        const users = await database_1.default.user.findMany({
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
    async getUserById(id) {
        const user = await database_1.default.user.findUnique({
            where: { id },
            include: {
                role: true,
                staffProfile: true,
            },
        });
        if (!user) {
            throw new errorHandler_1.AppError('User not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        return this.formatUser(user);
    }
    async createUser(input) {
        const emailNormalized = (input.email || '').trim().toLowerCase();
        if (!emailNormalized) {
            throw new errorHandler_1.AppError('Email address is required', constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        const rawPhone = input.phone && input.phone.trim() ? input.phone.trim() : null;
        const phoneClean = rawPhone ? rawPhone.replace(/\s+/g, '') : null;
        // Check if user already exists with this email
        const existingEmail = await database_1.default.user.findUnique({
            where: { email: emailNormalized },
        });
        if (existingEmail) {
            throw new errorHandler_1.AppError('A user with this email address already exists', constants_1.HTTP_STATUS.CONFLICT);
        }
        // Check if user already exists with this phone (if provided)
        if (rawPhone) {
            const existingPhone = await database_1.default.user.findFirst({
                where: {
                    OR: [
                        { phone: rawPhone },
                        ...(phoneClean && phoneClean !== rawPhone ? [{ phone: phoneClean }] : []),
                        { staffProfile: { phone: rawPhone } },
                        ...(phoneClean && phoneClean !== rawPhone ? [{ staffProfile: { phone: phoneClean } }] : []),
                    ],
                },
            });
            if (existingPhone) {
                throw new errorHandler_1.AppError('A staff member with this phone number already exists', constants_1.HTTP_STATUS.CONFLICT);
            }
        }
        const roleUpper = input.role.toUpperCase();
        const roleRecord = await database_1.default.role.findFirst({
            where: { name: roleUpper },
        });
        if (!roleRecord) {
            throw new errorHandler_1.AppError(`Invalid role: ${input.role}`, constants_1.HTTP_STATUS.BAD_REQUEST);
        }
        const passwordToHash = input.password && input.password.trim() ? input.password.trim() : '123456';
        const passwordHash = await bcrypt_1.default.hash(passwordToHash, 10);
        const specialtiesJson = (Array.isArray(input.specialties) ? input.specialties : []).map((s) => (s === 'Massage' ? 'Body Massage' : s));
        const user = await database_1.default.user.create({
            data: {
                email: emailNormalized,
                phone: rawPhone,
                passwordHash,
                roleId: roleRecord.id,
                isActive: true,
                staffProfile: {
                    create: {
                        name: input.name.trim(),
                        phone: rawPhone,
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
    async updateUser(id, input) {
        const existing = await database_1.default.user.findUnique({
            where: { id },
            include: {
                role: true,
                staffProfile: true,
            },
        });
        if (!existing) {
            throw new errorHandler_1.AppError('User not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        const userUpdates = {};
        if (input.role) {
            const roleUpper = input.role.toUpperCase();
            const roleRecord = await database_1.default.role.findFirst({
                where: { name: roleUpper },
            });
            if (!roleRecord) {
                throw new errorHandler_1.AppError(`Invalid role: ${input.role}`, constants_1.HTTP_STATUS.BAD_REQUEST);
            }
            userUpdates.roleId = roleRecord.id;
        }
        if (input.password && input.password.trim()) {
            userUpdates.passwordHash = await bcrypt_1.default.hash(input.password.trim(), 10);
        }
        if (input.active !== undefined) {
            userUpdates.isActive = input.active;
        }
        else if (input.isActive !== undefined) {
            userUpdates.isActive = input.isActive;
        }
        if (input.email && input.email.trim()) {
            const emailNormalized = input.email.trim().toLowerCase();
            if (emailNormalized !== existing.email) {
                const conflict = await database_1.default.user.findUnique({ where: { email: emailNormalized } });
                if (conflict) {
                    throw new errorHandler_1.AppError('Email address already in use by another user', constants_1.HTTP_STATUS.CONFLICT);
                }
                userUpdates.email = emailNormalized;
            }
        }
        // Update staffProfile
        const profileUpdates = {};
        if (input.name !== undefined && input.name.trim()) {
            profileUpdates.name = input.name.trim();
        }
        if (input.phone !== undefined) {
            const rawPhone = input.phone && input.phone.trim() ? input.phone.trim() : null;
            if (rawPhone && rawPhone !== existing.phone) {
                const phoneConflict = await database_1.default.user.findFirst({
                    where: {
                        id: { not: id },
                        OR: [
                            { phone: rawPhone },
                            { staffProfile: { phone: rawPhone } },
                        ],
                    },
                });
                if (phoneConflict) {
                    throw new errorHandler_1.AppError('Phone number already in use by another user', constants_1.HTTP_STATUS.CONFLICT);
                }
            }
            userUpdates.phone = rawPhone;
            profileUpdates.phone = rawPhone;
        }
        if (input.specialties !== undefined) {
            const specs = Array.isArray(input.specialties) ? input.specialties : [];
            profileUpdates.specialties = specs.map((s) => (s === 'Massage' ? 'Body Massage' : s));
        }
        await database_1.default.$transaction(async (tx) => {
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
                }
                else {
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
        const updated = await database_1.default.user.findUnique({
            where: { id },
            include: {
                role: true,
                staffProfile: true,
            },
        });
        return this.formatUser(updated);
    }
    async deleteUser(id) {
        const existing = await database_1.default.user.findUnique({ where: { id } });
        if (!existing) {
            throw new errorHandler_1.AppError('User not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        await database_1.default.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
}
exports.UsersService = UsersService;
exports.usersService = new UsersService();
//# sourceMappingURL=users.service.js.map