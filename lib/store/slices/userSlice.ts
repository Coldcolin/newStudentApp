import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  cohort?: string;
  enrollmentDate: string;
  status: "active" | "inactive" | "suspended";
  grade?: string;
}

export interface Assessment {
  id: string;
  title: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  score?: number;
  maxScore: number;
}

export interface UserState {
  students: Student[];
  selectedStudent: Student | null;
  assessments: Assessment[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    search: string;
    status: string;
    cohort: string;
  };
}

// Initial state
const initialState: UserState = {
  students: [],
  selectedStudent: null,
  assessments: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    status: "all",
    cohort: "all",
  },
};

// Mock data for demo
const mockStudents: Student[] = [
  { id: "1", firstName: "Amanda", lastName: "Chukwuma", email: "amanda@example.com", cohort: "Cohort 2024", enrollmentDate: "2024-01-15", status: "active" },
  { id: "2", firstName: "David", lastName: "Okonkwo", email: "david@example.com", cohort: "Cohort 2024", enrollmentDate: "2024-01-15", status: "active" },
  { id: "3", firstName: "Sarah", lastName: "Williams", email: "sarah@example.com", cohort: "Cohort 2023", enrollmentDate: "2023-06-01", status: "active" },
];

// Async thunks - Self-contained with mock data for demo
export const fetchStudents = createAsyncThunk(
  "user/fetchStudents",
  async (
    params: { page?: number; limit?: number; search?: string; status?: string },
    { rejectWithValue }
  ) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        data: mockStudents,
        page: params.page || 1,
        limit: params.limit || 10,
        total: mockStudents.length,
        totalPages: 1,
      };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch students");
    }
  }
);

export const fetchStudentById = createAsyncThunk(
  "user/fetchStudentById",
  async (id: string, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const student = mockStudents.find((s) => s.id === id);
      if (!student) throw new Error("Student not found");
      return student;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch student");
    }
  }
);

export const updateStudent = createAsyncThunk(
  "user/updateStudent",
  async (
    { id, data }: { id: string; data: Partial<Student> },
    { rejectWithValue }
  ) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const student = mockStudents.find((s) => s.id === id);
      if (!student) throw new Error("Student not found");
      return { ...student, ...data };
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to update student");
    }
  }
);

export const deleteStudent = createAsyncThunk(
  "user/deleteStudent",
  async (id: string, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return id;
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to delete student");
    }
  }
);

export const fetchAssessments = createAsyncThunk(
  "user/fetchAssessments",
  async (_studentId?: string, { rejectWithValue }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return [
        { id: "1", title: "Week 5 Assessment", dueDate: "2024-03-20", status: "pending" as const, maxScore: 100 },
        { id: "2", title: "JavaScript Fundamentals", dueDate: "2024-03-15", status: "graded" as const, score: 85, maxScore: 100 },
      ];
    } catch (error) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue("Failed to fetch assessments");
    }
  }
);

// User slice
const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (
      state,
      action: PayloadAction<Partial<UserState["filters"]>>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    setSelectedStudent: (state, action: PayloadAction<Student | null>) => {
      state.selectedStudent = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch students
      .addCase(fetchStudents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.students = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          totalPages: action.payload.totalPages,
        };
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch student by ID
      .addCase(fetchStudentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStudentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedStudent = action.payload;
      })
      .addCase(fetchStudentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update student
      .addCase(updateStudent.fulfilled, (state, action) => {
        const index = state.students.findIndex(
          (s) => s.id === action.payload.id
        );
        if (index !== -1) {
          state.students[index] = action.payload;
        }
        if (state.selectedStudent?.id === action.payload.id) {
          state.selectedStudent = action.payload;
        }
      })
      // Delete student
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter((s) => s.id !== action.payload);
        if (state.selectedStudent?.id === action.payload) {
          state.selectedStudent = null;
        }
      })
      // Fetch assessments
      .addCase(fetchAssessments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAssessments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.assessments = action.payload;
      })
      .addCase(fetchAssessments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSelectedStudent,
  setPage,
} = userSlice.actions;
export default userSlice.reducer;
