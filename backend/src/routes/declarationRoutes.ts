// backend/src/routes/declarationRoutes.ts
import { Router } from 'express';
import { DeclarationController } from '../controllers/DeclarationController';

const router: Router = Router();

router.get('/', DeclarationController.getCurrent);
router.put('/', DeclarationController.save);

export default router;
