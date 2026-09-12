import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// POST /api/v1/auth/login
router.post('/login', (req, res, next) => authController.login(req, res, next));

// GET /api/v1/auth/me
router.get('/me', authMiddleware, (req, res, next) => authController.getCurrentUser(req, res, next));

export default router;
