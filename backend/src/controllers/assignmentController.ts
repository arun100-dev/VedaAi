import { Request, Response } from 'express';
import { AssignmentModel } from '../models/Assignment';
import { UserModel } from '../models/User';
import { assessmentQueue, assessmentQueueEvents } from '../config/queue';
import { wsManager } from '../config/websocket';
import { AssignmentInput } from '../types';
import Joi from 'joi';

const assignmentSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  subject: Joi.string().min(1).max(100).required(),
  className: Joi.string().min(1).max(50).required(),
  dueDate: Joi.string().required(),
  schoolName: Joi.string().allow('').optional(),
  questionTypes: Joi.array().items(
    Joi.object({
      type: Joi.string().required(),
      numberOfQuestions: Joi.number().min(1).max(50).required(),
      marksPerQuestion: Joi.number().min(1).max(100).required(),
    })
  ).min(1).required(),
  additionalInstructions: Joi.string().allow('').optional(),
  fileName: Joi.string().optional(),
  fileContent: Joi.string().optional(),
});

export async function createAssignment(req: Request, res: Response) {
  try {
    const { error, value } = assignmentSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const userId = (req as any).userId;

    // Get user's school name to use on paper header
    const user = await UserModel.findById(userId).select('school name');
    const schoolName = user?.school || 'My School';

    const inputWithSchool: AssignmentInput = { ...value, schoolName };

    const assignment = new AssignmentModel({ ...value, userId, status: 'pending' });
    await assignment.save();

    const job = await assessmentQueue.add('generate-assessment',
      { assignmentId: assignment._id.toString(), input: inputWithSchool },
      { jobId: `job-${assignment._id}` }
    );
    await AssignmentModel.findByIdAndUpdate(assignment._id, { jobId: job.id });

    const assignmentId = assignment._id.toString();

    assessmentQueueEvents.on('progress', async ({ jobId, data }) => {
      if (jobId === job.id) {
        wsManager.broadcast(assignmentId, { type: 'JOB_PROGRESS', payload: { jobId: job.id!, assignmentId, status: 'active', progress: typeof data === 'number' ? data : 0, message: 'Generating your question paper...' } });
      }
    });
    assessmentQueueEvents.on('completed', async ({ jobId }) => {
      if (jobId === job.id) {
        const updated = await AssignmentModel.findById(assignmentId);
        wsManager.broadcast(assignmentId, { type: 'JOB_COMPLETED', payload: { jobId: job.id!, assignmentId, status: 'completed', progress: 100, message: 'Done!', result: updated?.generatedPaper as any } });
      }
    });
    assessmentQueueEvents.on('failed', ({ jobId, failedReason }) => {
      if (jobId === job.id) {
        wsManager.broadcast(assignmentId, { type: 'JOB_FAILED', payload: { jobId: job.id!, assignmentId, status: 'failed', progress: 0, message: 'Failed', error: failedReason } });
      }
    });

    return res.status(201).json({ success: true, data: { assignmentId: assignment._id, jobId: job.id, status: 'pending' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAssignments(req: Request, res: Response) {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const userId = (req as any).userId;
    const filter: any = { userId };
    if (search) filter.$or = [{ title: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }];
    const assignments = await AssignmentModel.find(filter).select('-fileContent -generatedPaper').sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page) - 1) * Number(limit));
    const total = await AssignmentModel.countDocuments(filter);
    return res.json({ success: true, data: assignments, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAssignment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const assignment = await AssignmentModel.findOne({ _id: req.params.id, userId });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    return res.json({ success: true, data: assignment });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteAssignment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    await AssignmentModel.findOneAndDelete({ _id: req.params.id, userId });
    return res.json({ success: true, message: 'Assignment deleted' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getJobStatus(req: Request, res: Response) {
  try {
    const job = await assessmentQueue.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const state = await job.getState();
    return res.json({ success: true, data: { jobId: req.params.jobId, state, progress: job.progress, failedReason: job.failedReason } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function regenerateAssignment(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const assignment = await AssignmentModel.findOne({ _id: req.params.id, userId });
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    await AssignmentModel.findByIdAndUpdate(assignment._id, { status: 'pending', generatedPaper: undefined });

    const user = await UserModel.findById(userId).select('school');
    const schoolName = user?.school || 'My School';

    const input: AssignmentInput = {
      title: assignment.title, subject: assignment.subject, className: assignment.className,
      dueDate: assignment.dueDate, questionTypes: assignment.questionTypes,
      additionalInstructions: assignment.additionalInstructions,
      fileContent: assignment.fileContent, fileName: assignment.fileName,
      schoolName,
    };
    const job = await assessmentQueue.add('generate-assessment', { assignmentId: assignment._id.toString(), input });
    return res.json({ success: true, data: { jobId: job.id, status: 'pending' } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
