import { Request, Response, NextFunction } from 'express';
import { invoicesService } from './invoices.service';
import {
  createInvoiceSchema,
  addInvoiceItemSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
} from './invoices.validation';
import { HTTP_STATUS } from '../../config/constants';
import { AuthContextUser } from './invoices.types';

function getParamId(req: Request, key: string = 'id'): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}

export class InvoicesController {
  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createInvoiceSchema.parse(req.body);
      const authUser = (req as any).user as AuthContextUser;
      const invoice = await invoicesService.createInvoice(validated, authUser);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async addInvoiceItem(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceId = getParamId(req, 'id');
      const validated = addInvoiceItemSchema.parse(req.body);
      const authUser = (req as any).user as AuthContextUser;
      const item = await invoicesService.addInvoiceItem(invoiceId, validated, authUser);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Invoice item added successfully',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPendingInvoices(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoicesService.getPendingInvoices();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const query = invoiceQuerySchema.parse(req.query);
      const result = await invoicesService.getInvoices(query);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParamId(req, 'id');
      const invoice = await invoicesService.getInvoiceById(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = getParamId(req, 'id');
      const validated = updateInvoiceSchema.parse(req.body);
      const authUser = (req as any).user as AuthContextUser;
      const invoice = await invoicesService.updateInvoice(id, validated, authUser);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const invoicesController = new InvoicesController();
