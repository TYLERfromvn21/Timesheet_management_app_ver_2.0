// backend/src/routes/userRoutes.ts
//This file defines the routes for user-related operations.
// and connects them to the corresponding controller methods.
import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router: Router = Router();

// 1. route to create a new user
// 2. route to get all users
// 3. route to update a user
// 4. route to delete a user
router.post('/create', UserController.create);
router.get('/all', UserController.getAll);     
router.post('/update', UserController.update);   
router.post('/delete', UserController.delete);  

export default router;