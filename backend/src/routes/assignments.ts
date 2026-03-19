import { Router } from 'express';
import {
  createAssignment, getAssignments, getAssignment,
  deleteAssignment, getJobStatus, regenerateAssignment,
} from '../controllers/assignmentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAssignments);
router.post('/', createAssignment);
router.get('/:id', getAssignment);
router.delete('/:id', deleteAssignment);
router.post('/:id/regenerate', regenerateAssignment);
router.get('/jobs/:jobId/status', getJobStatus);

export default router;
