export interface QuestionType {
  type: string;
  numberOfQuestions: number;
  marksPerQuestion: number;
}

export interface AssignmentInput {
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  questionTypes: QuestionType[];
  additionalInstructions?: string;
  fileContent?: string;
  fileName?: string;
  schoolName?: string;
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
  _id?: string;
  userId?: string;
  title: string;
  subject: string;
  className: string;
  dueDate: string;
  schoolName?: string;
  questionTypes: QuestionType[];
  additionalInstructions?: string;
  fileName?: string;
  fileContent?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generatedPaper?: GeneratedPaper;
  jobId?: string;
  createdAt?: Date;
  updatedAt?: Date;
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
