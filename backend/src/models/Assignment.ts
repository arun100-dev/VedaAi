import mongoose, { Schema, Document } from 'mongoose';
import { Assignment, GeneratedPaper } from '../types';

export interface AssignmentDocument extends Omit<Assignment, '_id'>, Document {}

const QuestionTypeSchema = new Schema({
  type: { type: String, required: true },
  numberOfQuestions: { type: Number, required: true, min: 1 },
  marksPerQuestion: { type: Number, required: true, min: 1 },
});

const QuestionSchema = new Schema({
  id: String, text: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  marks: Number, type: String, answer: String,
});

const SectionSchema = new Schema({
  id: String, title: String, instruction: String,
  questionType: String, questions: [QuestionSchema], totalMarks: Number,
});

const GeneratedPaperSchema = new Schema({
  schoolName: String, subject: String, className: String,
  timeAllowed: String, totalMarks: Number, instructions: [String],
  sections: [SectionSchema], answerKey: [{ questionId: String, answer: String }],
});

const AssignmentSchema = new Schema<AssignmentDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    title: { type: String, required: true },
    subject: { type: String, required: true },
    className: { type: String, required: true },
    dueDate: { type: String, required: true },
    questionTypes: [QuestionTypeSchema],
    additionalInstructions: String,
    fileName: String,
    fileContent: String,
    schoolName: String,
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    generatedPaper: GeneratedPaperSchema,
    jobId: String,
  },
  { timestamps: true }
);

export const AssignmentModel = mongoose.model<AssignmentDocument>('Assignment', AssignmentSchema);
