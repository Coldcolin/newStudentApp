import { api } from "@/lib/api/axios";
import type { Student, Assessment } from "@/lib/store/slices/userSlice";

// Response types
interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Request types
interface GetStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  cohort?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// User Service
export const userService = {
  /**
   * Get paginated list of students
   */
  getStudents: async (
    params: GetStudentsParams = {}
  ): Promise<PaginatedResponse<Student>> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.status && params.status !== "all")
      queryParams.append("status", params.status);
    if (params.cohort && params.cohort !== "all")
      queryParams.append("cohort", params.cohort);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const query = queryParams.toString();
    return api.get<PaginatedResponse<Student>>(
      `/students${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get student by ID
   */
  getStudentById: async (id: string): Promise<Student> => {
    return api.get<Student>(`/students/${id}`);
  },

  /**
   * Create new student
   */
  createStudent: async (
    data: Omit<Student, "id" | "enrollmentDate">
  ): Promise<Student> => {
    return api.post<Student>("/students", data);
  },

  /**
   * Update student
   */
  updateStudent: async (
    id: string,
    data: Partial<Student>
  ): Promise<Student> => {
    return api.patch<Student>(`/students/${id}`, data);
  },

  /**
   * Delete student
   */
  deleteStudent: async (id: string): Promise<void> => {
    return api.delete(`/students/${id}`);
  },

  /**
   * Get student assessments
   */
  getAssessments: async (studentId?: string): Promise<Assessment[]> => {
    const url = studentId
      ? `/students/${studentId}/assessments`
      : "/assessments";
    return api.get<Assessment[]>(url);
  },

  /**
   * Create assessment
   */
  createAssessment: async (
    data: Omit<Assessment, "id">
  ): Promise<Assessment> => {
    return api.post<Assessment>("/assessments", data);
  },

  /**
   * Update assessment
   */
  updateAssessment: async (
    id: string,
    data: Partial<Assessment>
  ): Promise<Assessment> => {
    return api.patch<Assessment>(`/assessments/${id}`, data);
  },

  /**
   * Submit assessment grade
   */
  gradeAssessment: async (
    id: string,
    data: { score: number; feedback?: string }
  ): Promise<Assessment> => {
    return api.post<Assessment>(`/assessments/${id}/grade`, data);
  },

  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<{
    totalStudents: number;
    activeStudents: number;
    pendingAssessments: number;
    averageScore: number;
  }> => {
    return api.get("/dashboard/stats");
  },

  /**
   * Get assessment performance data
   */
  getPerformanceData: async (
    period?: "week" | "month" | "year"
  ): Promise<{ month: string; assessments: number; avgScore: number }[]> => {
    return api.get(`/dashboard/performance${period ? `?period=${period}` : ""}`);
  },

  /**
   * Upload student avatar
   */
  uploadAvatar: async (studentId: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("avatar", file);

    return api.post(`/students/${studentId}/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Bulk update students
   */
  bulkUpdateStudents: async (
    ids: string[],
    data: Partial<Student>
  ): Promise<Student[]> => {
    return api.patch<Student[]>("/students/bulk", { ids, data });
  },

  /**
   * Export students to CSV
   */
  exportStudents: async (params?: GetStudentsParams): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.cohort) queryParams.append("cohort", params.cohort);

    const query = queryParams.toString();
    const response = await api.get<Blob>(
      `/students/export${query ? `?${query}` : ""}`,
      { responseType: "blob" }
    );
    return response;
  },
};
