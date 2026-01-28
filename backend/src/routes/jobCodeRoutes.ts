import { Router } from 'express';
import { JobCodeController } from '../controllers/JobCodeController';

const router = Router();

router.get('/:dept', JobCodeController.getByDept);
router.post('/save', JobCodeController.create);
router.post('/delete', JobCodeController.delete);

export default router;