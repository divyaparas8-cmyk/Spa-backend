"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientsService = exports.ClientsService = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
const errorHandler_1 = require("../../middleware/errorHandler");
const constants_1 = require("../../config/constants");
class ClientsService {
    async createClient(data, authUser) {
        const trimmedPhone = data.phone.trim();
        const cleanPhone = trimmedPhone.replace(/[\s\-\+\(\)]/g, '');
        // 1. Check duplicate phone (exact and normalized digits comparison)
        const existing = await database_1.default.client.findFirst({
            where: {
                OR: [
                    { phone: trimmedPhone },
                    { whatsapp: trimmedPhone },
                ],
            },
        });
        if (existing) {
            throw new errorHandler_1.AppError(`Client with this phone number already exists (${existing.name})`, constants_1.HTTP_STATUS.CONFLICT);
        }
        if (cleanPhone) {
            const allClients = await database_1.default.client.findMany({ select: { id: true, name: true, phone: true, whatsapp: true } });
            const duplicateNormalized = allClients.find((c) => {
                const cPhoneClean = (c.phone || '').replace(/[\s\-\+\(\)]/g, '');
                const cWaClean = (c.whatsapp || '').replace(/[\s\-\+\(\)]/g, '');
                return (cPhoneClean && cPhoneClean === cleanPhone) || (cWaClean && cWaClean === cleanPhone);
            });
            if (duplicateNormalized) {
                throw new errorHandler_1.AppError(`Client with this phone number already exists (${duplicateNormalized.name})`, constants_1.HTTP_STATUS.CONFLICT);
            }
        }
        // 2. Client Acquisition Tracking Business Rule:
        // When the logged-in user is a MANAGER:
        // - Client is created normally (DIRECT).
        // - No referral attribution, no employee referral commission, no Manager commission.
        // - Even if referral info is sent manually via API by a Manager, it is stripped.
        let introducedByEmployeeId = null;
        let source = client_1.ClientSource.DIRECT;
        let referredByClientId = null;
        let recommendedByName = null;
        let recommendedByPhone = null;
        if (authUser.role === 'MANAGER') {
            // Manager client creation: strictly normal DIRECT client with no referral attribution
            introducedByEmployeeId = null;
            source = client_1.ClientSource.DIRECT;
            referredByClientId = null;
            recommendedByName = null;
            recommendedByPhone = null;
        }
        else if (authUser.role === 'TECHNICIAN') {
            // Technician creates client: auto-attribute to technician
            introducedByEmployeeId = authUser.id;
            source = client_1.ClientSource.STAFF_REFERRAL;
        }
        else {
            // Other staff (e.g. RECEPTION):
            if (data.introducedByEmployeeId) {
                // Verify introducedByEmployeeId is an eligible staff member (NOT a Manager)
                const employee = await database_1.default.user.findUnique({
                    where: { id: data.introducedByEmployeeId },
                    include: { role: true },
                });
                if (employee && employee.role?.name !== 'MANAGER') {
                    introducedByEmployeeId = data.introducedByEmployeeId;
                    source = client_1.ClientSource.STAFF_REFERRAL;
                }
                else {
                    // Manager can never be an introducedBy employee
                    introducedByEmployeeId = null;
                    source = client_1.ClientSource.DIRECT;
                }
            }
            else if (data.referredByClientId) {
                referredByClientId = data.referredByClientId;
                source = client_1.ClientSource.CLIENT_REFERRAL;
            }
            else if (data.source) {
                source = data.source;
            }
            if (data.recommendedByName) {
                recommendedByName = data.recommendedByName.trim() || null;
            }
            if (data.recommendedByPhone) {
                recommendedByPhone = data.recommendedByPhone.trim() || null;
            }
        }
        // Parse dates
        const birthday = data.birthday ? new Date(data.birthday) : null;
        const anniversary = data.anniversary ? new Date(data.anniversary) : null;
        // 3. Create client in database
        const client = await database_1.default.client.create({
            data: {
                name: data.name.trim(),
                phone: trimmedPhone,
                whatsapp: data.whatsapp ? data.whatsapp.trim() : null,
                quartier: data.quartier ? data.quartier.trim() : null,
                birthday,
                anniversary,
                source,
                introducedByEmployeeId,
                referredByClientId,
                recommendedByName,
                recommendedByPhone,
                isActive: true,
                status: 'ACTIVE',
            },
            include: {
                introducedByEmployee: {
                    select: {
                        id: true,
                        email: true,
                        staffProfile: { select: { name: true } },
                    },
                },
            },
        });
        // 4. Create client history record: CLIENT_CREATED
        await database_1.default.clientHistory.create({
            data: {
                clientId: client.id,
                action: 'CLIENT_CREATED',
                details: `Client registered via ${source} by ${authUser.role}`,
                performedBy: authUser.id,
            },
        });
        return client;
    }
    async getClients(query) {
        const page = Math.max(1, parseInt(String(query.page || 1), 10));
        const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || 20), 10)));
        const skip = (page - 1) * limit;
        const where = {};
        // Dynamic status filtering: ACTIVE, INACTIVE, ALL
        const rawStatus = (query.status || '').toString().toUpperCase();
        if (rawStatus === 'ACTIVE' || query.isActive === true || query.isActive === 'true') {
            where.isActive = true;
        }
        else if (rawStatus === 'INACTIVE' || query.isActive === false || query.isActive === 'false') {
            where.isActive = false;
        }
        // If rawStatus === 'ALL' or query.isActive === 'all' or empty, returns both active and inactive
        if (query.search && query.search.trim() !== '') {
            const search = query.search.trim();
            where.OR = [
                { name: { contains: search } },
                { phone: { contains: search } },
                { whatsapp: { contains: search } },
            ];
        }
        const [total, clients] = await Promise.all([
            database_1.default.client.count({ where }),
            database_1.default.client.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    introducedByEmployee: {
                        select: {
                            id: true,
                            email: true,
                            staffProfile: { select: { name: true } },
                        },
                    },
                    appointments: {
                        orderBy: { appointmentDate: 'desc' },
                        take: 1,
                        select: {
                            appointmentDate: true,
                            serviceSummary: true,
                            appointmentServices: {
                                take: 1,
                                select: {
                                    service: {
                                        select: { name: true },
                                    },
                                },
                            },
                        },
                    },
                    _count: {
                        select: { appointments: true },
                    },
                },
            }),
        ]);
        return {
            clients: clients.map((c) => {
                const { _count, appointments, ...rest } = c;
                const latestAppt = appointments?.[0];
                const latestServiceName = latestAppt?.serviceSummary ||
                    latestAppt?.appointmentServices?.[0]?.service?.name ||
                    c.firstAppointmentService ||
                    null;
                const latestServiceDate = c.lastServiceDate ||
                    latestAppt?.appointmentDate ||
                    c.lastVisitAt ||
                    null;
                return {
                    ...rest,
                    status: c.status || (c.isActive ? 'ACTIVE' : 'INACTIVE'),
                    lastService: latestServiceName,
                    lastServiceDate: latestServiceDate,
                    appointmentsCount: _count.appointments,
                };
            }),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getClientById(id) {
        const client = await database_1.default.client.findUnique({
            where: { id },
            include: {
                media: {
                    orderBy: { createdAt: 'desc' },
                },
                history: {
                    orderBy: { createdAt: 'desc' },
                },
                introducedByEmployee: {
                    select: {
                        id: true,
                        email: true,
                        staffProfile: { select: { name: true, phone: true } },
                    },
                },
                referredByClient: {
                    select: { id: true, name: true, phone: true },
                },
                appointments: {
                    orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
                    include: {
                        appointmentServices: {
                            include: {
                                service: { select: { id: true, name: true, category: true, price: true } },
                                technician: {
                                    include: { staffProfile: { select: { name: true } } },
                                },
                            },
                        },
                        mainTechnician: {
                            include: { staffProfile: { select: { name: true } } },
                        },
                    },
                },
                _count: {
                    select: { appointments: true },
                },
            },
        });
        if (!client) {
            throw new errorHandler_1.AppError('Client not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        const { _count, appointments, ...rest } = client;
        const latestAppt = appointments?.[0];
        const latestServiceName = latestAppt?.serviceSummary ||
            latestAppt?.appointmentServices?.[0]?.service?.name ||
            client.firstAppointmentService ||
            null;
        const latestServiceDate = client.lastServiceDate ||
            latestAppt?.appointmentDate ||
            client.lastVisitAt ||
            null;
        return {
            ...rest,
            status: client.status || (client.isActive ? 'ACTIVE' : 'INACTIVE'),
            lastService: latestServiceName,
            lastServiceDate: latestServiceDate,
            appointmentsCount: _count.appointments,
            appointments: appointments || [],
        };
    }
    async updateClient(id, data, authUser) {
        const client = await database_1.default.client.findUnique({ where: { id } });
        if (!client) {
            throw new errorHandler_1.AppError('Client not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        if (data.phone && data.phone.trim() !== client.phone) {
            const newTrimmed = data.phone.trim();
            const newClean = newTrimmed.replace(/[\s\-\+\(\)]/g, '');
            const allOtherClients = await database_1.default.client.findMany({
                where: { id: { not: id } },
                select: { id: true, name: true, phone: true, whatsapp: true },
            });
            const phoneExists = allOtherClients.find((c) => {
                const cPhoneClean = (c.phone || '').replace(/[\s\-\+\(\)]/g, '');
                const cWaClean = (c.whatsapp || '').replace(/[\s\-\+\(\)]/g, '');
                return c.phone === newTrimmed || (cPhoneClean && cPhoneClean === newClean) || (cWaClean && cWaClean === newClean);
            });
            if (phoneExists) {
                throw new errorHandler_1.AppError(`Phone number already in use by client "${phoneExists.name}"`, constants_1.HTTP_STATUS.CONFLICT);
            }
        }
        const updateData = {};
        if (data.name !== undefined)
            updateData.name = data.name.trim();
        if (data.phone !== undefined) {
            updateData.phone = data.phone.trim();
            updateData.whatsapp = data.phone.trim();
        }
        if (data.whatsapp !== undefined && data.whatsapp) {
            updateData.whatsapp = data.whatsapp.trim();
        }
        if (data.quartier !== undefined)
            updateData.quartier = data.quartier ? data.quartier.trim() : null;
        if (data.birthday !== undefined)
            updateData.birthday = data.birthday ? new Date(data.birthday) : null;
        if (data.anniversary !== undefined)
            updateData.anniversary = data.anniversary ? new Date(data.anniversary) : null;
        if (data.status !== undefined) {
            const s = data.status.toUpperCase();
            updateData.status = s;
            updateData.isActive = s === 'ACTIVE';
        }
        else if (data.isActive !== undefined) {
            updateData.isActive = data.isActive;
            updateData.status = data.isActive ? 'ACTIVE' : 'INACTIVE';
        }
        if (data.lastServiceDate !== undefined) {
            updateData.lastServiceDate = data.lastServiceDate ? new Date(data.lastServiceDate) : null;
        }
        const updatedClient = await database_1.default.client.update({
            where: { id },
            data: updateData,
        });
        await database_1.default.clientHistory.create({
            data: {
                clientId: id,
                action: 'CLIENT_UPDATED',
                details: `Client updated by ${authUser.role} (${authUser.id})`,
                performedBy: authUser.id,
            },
        });
        return updatedClient;
    }
    async setClientStatus(id, status, authUser) {
        const client = await database_1.default.client.findUnique({ where: { id } });
        if (!client) {
            throw new errorHandler_1.AppError('Client not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        const isActive = status === 'ACTIVE';
        const updated = await database_1.default.client.update({
            where: { id },
            data: {
                isActive,
                status,
            },
        });
        await database_1.default.clientHistory.create({
            data: {
                clientId: id,
                action: isActive ? 'CLIENT_RESTORED' : 'CLIENT_DEACTIVATED',
                details: isActive
                    ? `Client status restored to Active by ${authUser.role}`
                    : `Client marked as Inactive by ${authUser.role}`,
                performedBy: authUser.id,
            },
        });
        return updated;
    }
    async deactivateClient(id, authUser) {
        return this.setClientStatus(id, 'INACTIVE', authUser);
    }
    async activateClient(id, authUser) {
        return this.setClientStatus(id, 'ACTIVE', authUser);
    }
    async addClientMedia(clientId, data, authUser) {
        const client = await database_1.default.client.findUnique({ where: { id: clientId } });
        if (!client) {
            throw new errorHandler_1.AppError('Client not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        const media = await database_1.default.clientMedia.create({
            data: {
                clientId,
                mediaType: data.mediaType,
                fileUrl: data.fileUrl.trim(),
                note: data.note ? data.note.trim() : null,
            },
        });
        await database_1.default.clientHistory.create({
            data: {
                clientId,
                action: 'MEDIA_ADDED',
                details: `${data.mediaType} photo added by ${authUser.role}`,
                performedBy: authUser.id,
            },
        });
        return media;
    }
    async getClientHistory(clientId) {
        const client = await database_1.default.client.findUnique({ where: { id: clientId } });
        if (!client) {
            throw new errorHandler_1.AppError('Client not found', constants_1.HTTP_STATUS.NOT_FOUND);
        }
        return database_1.default.clientHistory.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
exports.ClientsService = ClientsService;
exports.clientsService = new ClientsService();
//# sourceMappingURL=clients.service.js.map