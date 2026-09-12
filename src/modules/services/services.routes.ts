import { Router } from 'express';
import { servicesController } from './services.controller';
import { authMiddleware } from '../../middleware/authMiddleware';
import { allowRoles } from '../../middleware/roleMiddleware';

const router = Router();

router.use(authMiddleware);

// GET /api/v1/services — View services (Manager, Reception, Technician)
router.get('/', allowRoles('MANAGER', 'RECEPTION', 'TECHNICIAN'), (req, res, next) =>
  servicesController.getServices(req, res, next)
);

// GET /api/v1/services/:id — View single service (Manager, Reception, Technician)
router.get('/:id', allowRoles('MANAGER', 'RECEPTION', 'TECHNICIAN'), (req, res, next) =>
  servicesController.getServiceById(req, res, next)
);

// POST /api/v1/services — Create new service (Manager only)
router.post('/', allowRoles('MANAGER'), (req, res, next) =>
  servicesController.createService(req, res, next)
);

// PATCH /api/v1/services/:id — Update service (Manager only)
router.patch('/:id', allowRoles('MANAGER'), (req, res, next) =>
  servicesController.updateService(req, res, next)
);

// DELETE /api/v1/services/:id — Delete / Deactivate service (Manager only)
router.delete('/:id', allowRoles('MANAGER'), (req, res, next) =>
  servicesController.deleteService(req, res, next)
);

export default router;
