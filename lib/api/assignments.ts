import axiosInstance from "./axios";

// Types
export interface Assignment {
  _id: string;
  week: number;
  title: string;
  taskDescription: string;
  stack: "Front End" | "Back End" | "Product Design";
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
  stack: "Front End" | "Back End" | "Product Design";
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
 * Get assignments by week (Student only - requires auth, stack from token)
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
 * Get all assignments by week and stack (Tutor/Admin access)
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
): Promise<{ submissions: Submission[] }> {
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
