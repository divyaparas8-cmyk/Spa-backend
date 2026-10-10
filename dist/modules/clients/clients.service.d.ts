import { CreateClientInput, UpdateClientInput, AddClientMediaInput, ClientQueryFilter, AuthContextUser } from './clients.types';
export declare class ClientsService {
    createClient(data: CreateClientInput, authUser: AuthContextUser): Promise<{
        introducedByEmployee: {
            staffProfile: {
                name: string;
            } | null;
            id: string;
            email: string;
        } | null;
    } & {
        id: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: string;
        whatsapp: string | null;
        quartier: string | null;
        birthday: Date | null;
        anniversary: Date | null;
        source: import(".prisma/client").$Enums.ClientSource;
        introducedByEmployeeId: string | null;
        referredByClientId: string | null;
        recommendedByName: string | null;
        recommendedByPhone: string | null;
        recommendedByDate: Date | null;
        firstAppointmentService: string | null;
        noShowCount: number;
        lastVisitAt: Date | null;
        lastServiceDate: Date | null;
    }>;
    getClients(query: ClientQueryFilter): Promise<{
        clients: any[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getClientById(id: string): Promise<any>;
    updateClient(id: string, data: UpdateClientInput, authUser: AuthContextUser): Promise<{
        id: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: string;
        whatsapp: string | null;
        quartier: string | null;
        birthday: Date | null;
        anniversary: Date | null;
        source: import(".prisma/client").$Enums.ClientSource;
        introducedByEmployeeId: string | null;
        referredByClientId: string | null;
        recommendedByName: string | null;
        recommendedByPhone: string | null;
        recommendedByDate: Date | null;
        firstAppointmentService: string | null;
        noShowCount: number;
        lastVisitAt: Date | null;
        lastServiceDate: Date | null;
    }>;
    setClientStatus(id: string, status: 'ACTIVE' | 'INACTIVE', authUser: AuthContextUser): Promise<{
        id: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: string;
        whatsapp: string | null;
        quartier: string | null;
        birthday: Date | null;
        anniversary: Date | null;
        source: import(".prisma/client").$Enums.ClientSource;
        introducedByEmployeeId: string | null;
        referredByClientId: string | null;
        recommendedByName: string | null;
        recommendedByPhone: string | null;
        recommendedByDate: Date | null;
        firstAppointmentService: string | null;
        noShowCount: number;
        lastVisitAt: Date | null;
        lastServiceDate: Date | null;
    }>;
    deactivateClient(id: string, authUser: AuthContextUser): Promise<{
        id: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: string;
        whatsapp: string | null;
        quartier: string | null;
        birthday: Date | null;
        anniversary: Date | null;
        source: import(".prisma/client").$Enums.ClientSource;
        introducedByEmployeeId: string | null;
        referredByClientId: string | null;
        recommendedByName: string | null;
        recommendedByPhone: string | null;
        recommendedByDate: Date | null;
        firstAppointmentService: string | null;
        noShowCount: number;
        lastVisitAt: Date | null;
        lastServiceDate: Date | null;
    }>;
    activateClient(id: string, authUser: AuthContextUser): Promise<{
        id: string;
        phone: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        status: string;
        whatsapp: string | null;
        quartier: string | null;
        birthday: Date | null;
        anniversary: Date | null;
        source: import(".prisma/client").$Enums.ClientSource;
        introducedByEmployeeId: string | null;
        referredByClientId: string | null;
        recommendedByName: string | null;
        recommendedByPhone: string | null;
        recommendedByDate: Date | null;
        firstAppointmentService: string | null;
        noShowCount: number;
        lastVisitAt: Date | null;
        lastServiceDate: Date | null;
    }>;
    addClientMedia(clientId: string, data: AddClientMediaInput, authUser: AuthContextUser): Promise<{
        id: string;
        createdAt: Date;
        clientId: string;
        mediaType: import(".prisma/client").$Enums.MediaType;
        fileUrl: string;
        publicId: string | null;
        uploadedBy: string | null;
        note: string | null;
    }>;
    getClientHistory(clientId: string): Promise<{
        id: string;
        createdAt: Date;
        action: string;
        details: string | null;
        performedBy: string | null;
        clientId: string;
    }[]>;
}
export declare const clientsService: ClientsService;
//# sourceMappingURL=clients.service.d.ts.map