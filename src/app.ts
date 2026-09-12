import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import clientsRoutes from './modules/clients/clients.routes';
import appointmentsRoutes from './modules/appointments/appointments.routes';
import serviceCompletionRoutes from './modules/service-completion/serviceCompletion.routes';
import invoicesRoutes from './modules/invoices/invoices.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import stockRoutes from './modules/stock/stock.routes';
import commissionsRoutes from './modules/commissions/commissions.routes';
import loyaltyRoutes, { rebookingRouter } from './modules/loyalty/loyalty.routes';
import reportsRoutes from './modules/reports/reports.routes';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes';
import usersRoutes from './modules/users/users.routes';
import specialtiesRoutes from './modules/specialties/specialties.routes';
import servicesRoutes from './modules/services/services.routes';
import expensesRoutes from './modules/expenses/expenses.routes';
import uploadsRoutes from './modules/uploads/uploads.routes';
import mediaRoutes from './modules/media/media.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import path from 'path';

const app = express();

// ==================================================
// Security & Parsing Middleware
// ==================================================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.resolve(__dirname, '../../uploads')));

// ==================================================
// Request Logging
// ==================================================
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ==================================================
// Health Check Endpoint
// ==================================================
app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'OMEGA SPA POS Backend Running',
  });
});

// ==================================================
// API Routes (Mounted strictly under /api/v1)
// ==================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/specialties', specialtiesRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/clients', clientsRoutes);
app.use('/api/v1/appointments', appointmentsRoutes);
app.use('/api/v1/service-completion', serviceCompletionRoutes);
app.use('/api/v1/invoices', invoicesRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/commissions', commissionsRoutes);
app.use('/api/v1/loyalty', loyaltyRoutes);
app.use('/api/v1/rebooking', rebookingRouter);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/whatsapp', whatsappRoutes);
app.use('/api/v1/expenses', expensesRoutes);
app.use('/api/v1/uploads', uploadsRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1/attendance', attendanceRoutes);

// ==================================================
// Error Handling Middleware
// ==================================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
