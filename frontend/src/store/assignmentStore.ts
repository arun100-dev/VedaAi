import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Assignment, AssignmentFormData, JobStatus, QuestionType } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AssignmentStore {
  // Form state
  formData: AssignmentFormData;
  currentStep: number;

  // Assignments list
  assignments: Assignment[];
  totalAssignments: number;
  isLoadingAssignments: boolean;

  // Current assignment
  currentAssignment: Assignment | null;
  isCreating: boolean;

  // Job tracking
  jobStatus: JobStatus | null;
  wsConnected: boolean;

  // Actions - Form
  updateFormData: (data: Partial<AssignmentFormData>) => void;
  addQuestionType: () => void;
  removeQuestionType: (id: string) => void;
  updateQuestionType: (id: string, data: Partial<QuestionType>) => void;
  resetForm: () => void;
  setCurrentStep: (step: number) => void;

  // Actions - Assignments
  setAssignments: (assignments: Assignment[], total: number) => void;
  addAssignment: (assignment: Assignment) => void;
  removeAssignment: (id: string) => void;
  setCurrentAssignment: (assignment: Assignment | null) => void;
  setIsCreating: (val: boolean) => void;

  // Actions - Job
  setJobStatus: (status: JobStatus | null) => void;
  setWsConnected: (val: boolean) => void;
  updateJobStatus: (update: Partial<JobStatus>) => void;
}

const defaultFormData: AssignmentFormData = {
  title: '',
  subject: '',
  className: '',
  dueDate: '',
  questionTypes: [
    { id: uuidv4(), type: 'Multiple Choice Questions', numberOfQuestions: 4, marksPerQuestion: 1 },
  ],
  additionalInstructions: '',
  file: null,
  fileName: '',
  fileContent: '',
};

export const useAssignmentStore = create<AssignmentStore>()(
  persist(
    (set, get) => ({
      formData: defaultFormData,
      currentStep: 0,
      assignments: [],
      totalAssignments: 0,
      isLoadingAssignments: false,
      currentAssignment: null,
      isCreating: false,
      jobStatus: null,
      wsConnected: false,

      updateFormData: (data) =>
        set((state) => ({ formData: { ...state.formData, ...data } })),

      addQuestionType: () =>
        set((state) => ({
          formData: {
            ...state.formData,
            questionTypes: [
              ...state.formData.questionTypes,
              { id: uuidv4(), type: 'Short Answer Questions', numberOfQuestions: 3, marksPerQuestion: 2 },
            ],
          },
        })),

      removeQuestionType: (id) =>
        set((state) => ({
          formData: {
            ...state.formData,
            questionTypes: state.formData.questionTypes.filter((qt) => qt.id !== id),
          },
        })),

      updateQuestionType: (id, data) =>
        set((state) => ({
          formData: {
            ...state.formData,
            questionTypes: state.formData.questionTypes.map((qt) =>
              qt.id === id ? { ...qt, ...data } : qt
            ),
          },
        })),

      resetForm: () =>
        set({
          formData: {
            ...defaultFormData,
            questionTypes: [
              { id: uuidv4(), type: 'Multiple Choice Questions', numberOfQuestions: 4, marksPerQuestion: 1 },
            ],
          },
          currentStep: 0,
        }),

      setCurrentStep: (step) => set({ currentStep: step }),

      setAssignments: (assignments, total) =>
        set({ assignments, totalAssignments: total, isLoadingAssignments: false }),

      addAssignment: (assignment) =>
        set((state) => ({
          assignments: [assignment, ...state.assignments],
          totalAssignments: state.totalAssignments + 1,
        })),

      removeAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a._id !== id),
          totalAssignments: state.totalAssignments - 1,
        })),

      setCurrentAssignment: (assignment) => set({ currentAssignment: assignment }),
      setIsCreating: (val) => set({ isCreating: val }),
      setJobStatus: (status) => set({ jobStatus: status }),
      setWsConnected: (val) => set({ wsConnected: val }),
      updateJobStatus: (update) =>
        set((state) => ({
          jobStatus: state.jobStatus ? { ...state.jobStatus, ...update } : null,
        })),
    }),
    {
      name: 'vedaai-store',
      partialize: (state) => ({ assignments: state.assignments, totalAssignments: state.totalAssignments }),
    }
  )
);
