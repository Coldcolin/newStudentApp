import axiosInstance from "./axios";

// Types
export type AssignmentStack =
  | "Front End"
  | "Back End"
  | "Product Design"
  | "General";

/** "text" for legacy plain-text descriptions, "html" for rich-text ones. */
export type DescriptionFormat = "text" | "html";

export interface Assignment {
  _id: string;
  week: number;
  title: string;
  taskDescription: string;
  descriptionFormat?: DescriptionFormat;
  stack: AssignmentStack;
  dueDateTime: string;
  allowLateSubmissions: boolean;
  formattedDueDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Submission {
  _id: string;
  assignment: Assignment | string;
  student?: string;
  submissionLink: string;
  submittedAt: string;
  isLate: boolean;
  grade: number | null;
}

export interface StudentSubmission {
  _id: string;
  assignment: {
    _id: string;
    title: string;
    week: number;
    stack: string;
  };
  student: string;
  status: "Graded" | "Pending";
  submissionLink: string;
  submittedAt: string;
  isLate: boolean;
  grade: number | null;
}

/**
 * A submission as returned by GET /api/grading/assignment/:assignmentId, where
 * both `assignment` and `student` come back populated.
 */
export interface GradingSubmission {
  _id: string;
  assignment: {
    _id: string;
    title: string;
    week: number;
    stack: string;
    taskDescription?: string;
  };
  student: {
    _id: string;
    name: string;
    image?: string;
    stack: string;
  };
  submissionLink: string;
  feedback?: string;
  status: "Graded" | "Pending";
  submittedAt: string;
  isLate: boolean;
  grade: number | null;
}

export interface GradingStudent {
  student: {
    _id: string;
    name: string;
    image?: string;
    stack: string;
  };
  assignments: {
    submissionId: string;
    assignment: {
      _id: string;
      title: string;
      stack: string;
    };
    submissionLink: string;
    submittedAt: string;
    isLate: boolean;
    grade: number | null;
  }[];
}

export interface CreateAssignmentRequest {
  week: number;
  title: string;
  taskDescription: string;
  descriptionFormat?: DescriptionFormat;
  stack: AssignmentStack;
  dueDate: string;
  dueTime: string;
  allowLateSubmissions?: boolean;
}

export interface CreateAssignmentResponse {
  message: string;
  assignment: Assignment;
}

export interface SubmitAssignmentRequest {
  submissionLink: string;
}

export interface SubmitAssignmentResponse {
  message: string;
  submission: Submission;
}

export interface GradeSubmissionRequest {
  grade: number;
}

export interface GradeSubmissionResponse {
  message: string;
  grade: number;
}

export interface AddStudentRatingRequest {
  punctuality: number;
  Assignments: number;
  classParticipation: number;
  classAssessment: number;
  personalDefense: number;
  week: number;
}

export interface AddStudentRatingResponse {
  message: string;
  rating: {
    _id: string;
    student: string;
    punctuality: number;
    Assignments: number;
    classParticipation: number;
    classAssessment: number;
    personalDefense: number;
    week: number;
    total: number;
    createdAt: string;
  };
}

export interface PerformanceReviewRating {
  _id?: string;
  student?: string;
  week: number;
  punctuality?: number;
  Assignments?: number;
  classParticipation?: number;
  classAssessment?: number;
  personalDefense?: number;
  total?: number;
  title?: string;
  assessmentTitle?: string;
  status?: "graded" | "pending" | "late";
  createdAt?: string;
  updatedAt?: string;
}

export interface PerformanceReviewResponse {
  message?: string;
  ratings?: PerformanceReviewRating[];
  performanceReview?: PerformanceReviewRating[];
  currentWeekBreakdown?: PerformanceReviewRating;
}

// Assignment Management APIs

/**
 * Create a new assignment (Admin/Tutor only)
 */
export async function createAssignment(
  data: CreateAssignmentRequest,
): Promise<CreateAssignmentResponse> {
  const response = await axiosInstance.post(`/api/assignments/create`, data);
  return response.data;
}

/**
 * Get a week's assignments for the given stack, plus anything issued to
 * "General" (Student view - requires auth)
 */
export async function getAssignmentsByWeek(
  week: number,
  stack?: string,
): Promise<{ assignments: Assignment[] }> {
  const response = await axiosInstance.get(
    `/api/assignments/week/${week}/all`,
    {
      params: stack ? { stack } : undefined,
    },
  );
  return response.data;
}

/**
 * Get a week's assignments for a named stack, plus anything issued to
 * "General" (Tutor/Admin viewing a student's board)
 */
export async function getAllAssignmentsByWeek(
  week: number,
  stack: string,
): Promise<{ assignments: Assignment[] }> {
  const response = await axiosInstance.get(
    `/api/assignments/week/${week}/all`,
    {
      params: { stack },
    },
  );
  return response.data;
}

/**
 * Get all assignments (Tutor/Admin access)
 */
export async function getAllAssignments(): Promise<{
  assignments: Assignment[];
}> {
  const response = await axiosInstance.get(`/api/assignments/all`);
  return response.data;
}

/**
 * Update an assignment (Admin/Tutor only)
 */
export async function updateAssignment(
  assignmentId: string,
  data: Partial<CreateAssignmentRequest>,
): Promise<{ message: string; assignment: Assignment }> {
  const response = await axiosInstance.patch(
    `/api/assignments/${assignmentId}`,
    data,
  );
  return response.data;
}

/**
 * Delete an assignment (Admin/Tutor only)
 */
export async function deleteAssignment(
  assignmentId: string,
): Promise<{ message: string }> {
  const response = await axiosInstance.delete(
    `/api/assignments/${assignmentId}`,
  );
  return response.data;
}

// Submission Management APIs

/**
 * Submit an assignment (Student only - requires auth)
 */
export async function submitAssignment(
  assignmentId: string,
  data: SubmitAssignmentRequest,
): Promise<SubmitAssignmentResponse> {
  const response = await axiosInstance.post(
    `/api/submissions/${assignmentId}/submit`,
    data,
  );
  return response.data;
}

/**
 * Get student's submissions (Student only - requires auth)
 */
export async function getMySubmissions(
  week?: number,
): Promise<{ submissions: StudentSubmission[] }> {
  const params = week ? { week } : undefined;
  const response = await axiosInstance.get(`/api/submissions/my-submissions`, {
    params,
  });
  return response.data;
}

/**
 * Get submissions by student ID (Admin/Tutor access)
 * Endpoint: GET /api/submissions/student/:studentId
 */
export async function getStudentSubmissions(
  studentId: string,
  week?: number,
): Promise<{ submissions: StudentSubmission[] }> {
  const params = week ? { week } : undefined;
  const response = await axiosInstance.get(
    `/api/submissions/student/${studentId}`,
    {
      params,
    },
  );
  return response.data;
}

/**
 * Get submission by ID (Tutor/Admin access)
 */
export async function getSubmissionById(
  submissionId: string,
): Promise<{ submission: Submission }> {
  const response = await axiosInstance.get(`/api/submissions/${submissionId}`);
  return response.data;
}

// Grading Management APIs

/**
 * Grade a submission (Admin/Tutor only)
 */
export async function gradeSubmission(
  submissionId: string,
  grade: number,
): Promise<GradeSubmissionResponse> {
  const response = await axiosInstance.patch(
    `/api/grading/submission/${submissionId}`,
    { grade },
  );
  return response.data;
}

/**
 * Get submissions by week for grading (Admin/Tutor only)
 */
export async function getSubmissionsByWeekForGrading(
  week: number,
): Promise<{ students: GradingStudent[] }> {
  const response = await axiosInstance.get(`/api/grading/week/${week}`);
  return response.data;
}

/**
 * Get submissions by assignment for grading (Admin/Tutor only)
 */
export async function getSubmissionsByAssignment(
  assignmentId: string,
): Promise<{ submissions: GradingSubmission[] }> {
  const response = await axiosInstance.get(
    `/api/grading/assignment/${assignmentId}`,
  );
  return response.data;
}

/**
 * Add a rating for a student (Admin/Tutor only)
 * Endpoint: POST /ratings/add/{studentId}
 */
export async function addStudentRating(
  studentId: string,
  data: AddStudentRatingRequest,
): Promise<AddStudentRatingResponse> {
  const response = await axiosInstance.post(`/rating/add/${studentId}`, data);
  return response.data;
}

/**
 * Delete a student's weekly rating (Admin/Tutor only)
 * Endpoint: DELETE /rating/delete/{studentId}/{week}
 */
export async function deleteStudentRating(
  studentId: string,
  week: number,
): Promise<{ message: string }> {
  const response = await axiosInstance.delete(
    `/rating/delete/${studentId}/${week}`,
  );
  return response.data;
}

export interface UploadRatingsExcelResponse {
  message?: string;
  [key: string]: unknown;
}

/**
 * Bulk upload student ratings from an Excel file (Admin/Tutor only)
 * Endpoint: POST /rating/upload-excel
 */
export async function uploadRatingsExcel(
  file: File,
): Promise<UploadRatingsExcelResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post<UploadRatingsExcelResponse>(
    "/rating/upload-excel",
    formData,
    { timeout: 0 },
  );
  return response.data;
}

/**
 * Get a student's performance review (weekly ratings + breakdown).
 * Endpoint: GET /students/:id/performance-review
 */
export async function getStudentPerformanceReview(
  studentId: string,
): Promise<PerformanceReviewResponse> {
  const response = await axiosInstance.get(
    `/api/students/${studentId}/performance-review`,
  );
  return response.data;
}

/** One assignment issued to the student in a given week, with its grade if any. */
export interface AssignmentScoreItem {
  assignmentId: string;
  title: string;
  stack: AssignmentStack;
  dueDateTime: string;
  formattedDueDate?: string;
  submissionId: string | null;
  submissionLink: string | null;
  submittedAt: string | null;
  isLate: boolean;
  /** The recorded grade out of 20, or null when not submitted / not yet graded. */
  grade: number | null;
  status: "Graded" | "Pending" | "Not Submitted";
}

/**
 * A week's assignment performance. `cumulativeScore` is the week's grades
 * normalized to a single score out of 20, counting anything not graded as 0 —
 * it is null only when no assignments were issued that week.
 */
export interface WeeklyAssignmentScore {
  week: number;
  maxScore: number;
  totalAssignments: number;
  submittedCount: number;
  gradedCount: number;
  pointsEarned: number;
  pointsPossible: number;
  cumulativeScore: number | null;
  assignments: AssignmentScoreItem[];
}

export interface StudentAssignmentScoresResponse {
  student?: {
    _id: string;
    name: string;
    image?: string;
    stack: string;
  };
  maxScore: number;
  weeks: WeeklyAssignmentScore[];
}

/**
 * Get a student's cumulative assignment score out of 20, broken down by week.
 * Omit `week` to get every week at once.
 * Endpoint: GET /students/:id/assignment-scores
 */
export async function getStudentAssignmentScores(
  studentId: string,
  week?: number,
): Promise<StudentAssignmentScoresResponse> {
  const response = await axiosInstance.get(
    `/api/students/${studentId}/assignment-scores`,
    { params: week ? { week } : undefined },
  );
  return response.data;
}

/** The winner of a single task, or the task alone when nothing is graded yet. */
export interface TopPerformer {
  assignmentId: string;
  title: string;
  stack: AssignmentStack;
  /** Null when no submission for this task has been graded yet. */
  student: { _id: string; name: string; image?: string; stack: string } | null;
  /** The winning grade out of 20, or null when nothing is graded. */
  grade: number | null;
  submittedAt: string | null;
  /** How many students share the winning grade — 1 for an outright win. */
  tiedCount: number;
}

export interface WeeklyTopPerformersResponse {
  week: number;
  maxScore: number;
  topPerformers: TopPerformer[];
}

/**
 * Get the highest scorer for each of a week's tasks. Every task issued that week
 * comes back, with a null `student` where nothing has been graded yet.
 * Endpoint: GET /api/assignments/week/:week/top-performers
 */
export async function getTopPerformersByWeek(
  week: number,
  stack?: string,
): Promise<WeeklyTopPerformersResponse> {
  const response = await axiosInstance.get(
    `/api/assignments/week/${week}/top-performers`,
    { params: stack ? { stack } : undefined },
  );
  return response.data;
}

/** The API stores grades out of 20, the UI shows them out of 100. */
export const toDisplayScore = (grade: number | null) =>
  grade === null || grade === undefined ? null : grade * 5;
