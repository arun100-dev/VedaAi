export interface QuestionType {
  id: string;
  type: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface AssignmentFormData {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions: string;
  file: File | null;
  fileName: string;
  fileContent: string;
}

export interface Question {
  id: string;
  text: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  type: string;
  answer?: string;
}

export interface Section {
  id: string;
  title: string;
  instruction: string;
  questionType: string;
  questions: Question[];
  totalMarks: number;
}

export interface GeneratedPaper {
  schoolName: string;
  subject: string;
  className: string;
  timeAllowed: string;
  totalMarks: number;
  instructions: string[];
  sections: Section[];
  answerKey: { questionId: string; answer: string }[];
}

export interface Assignment {
  _id: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions?: string;
  fileName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generatedPaper?: GeneratedPaper;
  jobId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobStatus {
  jobId: string;
  assignmentId: string;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  message: string;
  result?: GeneratedPaper;
  error?: string;
}

export interface WSMessage {
  type: 'JOB_PROGRESS' | 'JOB_COMPLETED' | 'JOB_FAILED' | 'CONNECTED';
  payload: JobStatus | { message: string };
}

export const QUESTION_TYPE_OPTIONS = [
  'Multiple Choice Questions',
  'Short Answer Questions',
  'Long Answer Questions',
  'True/False Questions',
  'Fill in the Blanks',
  'Diagram/Graph-Based Questions',
  'Numerical Problems',
  'Match the Following',
  'Assertion-Reason Questions',
  'Case Study Questions',
];
