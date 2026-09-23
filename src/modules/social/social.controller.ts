import { Request, Response, NextFunction } from 'express';
import { socialService } from './social.service';
import { HTTP_STATUS } from '../../config/constants';

function getParamId(req: Request, key: string = 'id'): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}

export class SocialController {
  async getAccounts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await socialService.getAccounts();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPosts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await socialService.getPosts();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await socialService.createPost(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async publishPostNow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParamId(req, 'id');
      const data = await socialService.publishPostNow(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = getParamId(req, 'id');
      await socialService.deletePost(id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const socialController = new SocialController();
