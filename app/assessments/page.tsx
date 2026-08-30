"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  MoreVertical,
  Loader2,
  ArrowLeft,
  FileText,
  CheckSquare,
  Send,
  Plus,
  Calendar,
  Upload,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { RichText } from "@/components/ui/rich-text";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  isRichTextEmpty,
  richTextToPlain,
  toEditorHtml,
} from "@/lib/rich-text";
import { useCurrentUser } from "@/lib/store/hooks";
import { useProgramSettings } from "@/components/providers/program-settings-provider";
import { toast } from "sonner";
import axiosInstance, { type ApiError } from "@/lib/api/axios";
import * as XLSX from "xlsx";
import {
  Assignment,
  AssignmentStack,
  DescriptionFormat,
  GradingSubmission,
  StudentSubmission,
  PerformanceReviewRating,
  getAssignmentsByWeek,
  getAllAssignmentsByWeek,
  getAllAssignments,
  getStudentSubmissions,
  getSubmissionsByAssignment,
  submitAssignment,
  gradeSubmission,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  addStudentRating,
  getStudentPerformanceReview,
  uploadRatingsExcel,
} from "@/lib/api/assignments";

// Types
interface StudentRecord {
  _id: string;
  name: string;
  email: string;
  overallRating: number;
  weeklyRating: number;
  stack: string;
}

interface ExcelPreview {
  sheetName: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
}

const EXCEL_ACCEPT =
  ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

const EXCEL_PREVIEW_ROW_LIMIT = 50;

const isExcelFile = (file: File): boolean => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xls") return true;
  return (
    file.type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "application/vnd.ms-excel"
  );
};

const parseExcelPreview = async (file: File): Promise<ExcelPreview> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  if (workbook.SheetNames.length === 0) {
    throw new Error("The Excel file has no sheets.");
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(
    sheet,
    { header: 1, defval: "" },
  );

  if (rawRows.length === 0) {
    throw new Error("The selected sheet is empty.");
  }

  const toCell = (value: unknown) =>
    value === null || value === undefined ? "" : String(value);

  const headerRow = rawRows[0] ?? [];
  const maxColumns = Math.max(
    headerRow.length,
    ...rawRows.slice(1).map((row) => row.length),
  );

  const headers = Array.from({ length: maxColumns }, (_, index) => {
    const header = toCell(headerRow[index]).trim();
    return header || `Column ${index + 1}`;
  });

  const dataRows = rawRows.slice(1).map((row) =>
    Array.from({ length: maxColumns }, (_, index) => toCell(row[index])),
  );

  return {
    sheetName,
    headers,
    rows: dataRows.slice(0, EXCEL_PREVIEW_ROW_LIMIT),
    totalRows: dataRows.length,
  };
};

// Helper to normalize stack names for API
const normalizeStackForApi = (
  stack: string,
): "Front End" | "Back End" | "Product Design" => {
  const normalized = stack.toLowerCase().replace(/[-\s]/g, "");
  if (normalized.includes("front") || normalized.includes("frontend")) {
    return "Front End";
  }
  if (normalized.includes("back") || normalized.includes("backend")) {
    return "Back End";
  }
  return "Product Design";
};

// Format an individual breakdown category value as "x/20"
const formatBreakdownValue = (value: number | null | undefined): string =>
  typeof value === "number" ? `${value}/20` : "-";

// Compute the percentage total for a rating. Prefers the API-provided total,
// otherwise sums the five category fields (each scored 0-20, total 0-100).
const computeRatingTotal = (rating: PerformanceReviewRating): number | null => {
  if (typeof rating.total === "number") return rating.total;
  const parts = [
    rating.punctuality,
    rating.classParticipation,
    rating.classAssessment,
    rating.Assignments,
    rating.personalDefense,
  ];
  if (parts.every((v) => typeof v === "number")) {
    return (parts as number[]).reduce((a, b) => a + b, 0);
  }
  return null;
};

interface StudentAssessment {
  _id: string;
  name: string;
  avatar?: string;
  stack: string;
  week: number | null;
  hasCheck: boolean;
  avgPercent: string | null;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  descriptionFormat?: DescriptionFormat;
  dueDate: string;
  status: "completed" | "pending" | "in-progress";
  score?: number;
  assignment?: Assignment;
}

interface Submission {
  _id: string;
  title: string;
  submittedDate: string;
  status: "Graded" | "Pending";
  score?: number;
  feedback?: string;
  comments?: string;
  submissionLink?: string;
}



const stackTabs = ["Front-End", "Back-End", "Product Design"];

// Admin view is split between the student roster and the assignment (task) board
const adminSections = ["students", "tasks"];

const assignmentStacks: AssignmentStack[] = [
  "Front End",
  "Back End",
  "Product Design",
  "General",
];

const buildWeekOptions = (totalWeeks: number) =>
  Array.from({ length: totalWeeks }, (_, i) => i + 1);

type DueFilter = "all" | "upcoming" | "overdue";

const isOverdue = (assignment: Assignment) =>
  new Date(assignment.dueDateTime).getTime() < Date.now();

// The API stores grades out of 20, the UI shows them out of 100
const toDisplayScore = (grade: number | null) =>
  grade === null || grade === undefined ? null : grade * 5;

const formatSubmittedAt = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
};

// Shared copy: the backend hard-deletes an assignment along with every
// submission that references it, so the warning has to be explicit.
const deleteAssignmentWarning = (title: string) =>
  `Deleting "${title}" also permanently deletes every student submission, grade and piece of feedback for this task. This cannot be undone.`;

// ---------- Shared task form (Upload Task / Edit Task) ----------

interface TaskFormData {
  title: string;
  description: string;
  assignmentType: string;
  week: string;
  deadline: string;
  deadlineTime: string;
  allowLateSubmission: boolean;
}

const emptyTaskForm: TaskFormData = {
  title: "",
  description: "",
  assignmentType: "general",
  week: "",
  deadline: "",
  deadlineTime: "23:59",
  allowLateSubmission: false,
};

const assignmentTypes = ["general", "frontend", "backend", "product design"];

const stackByAssignmentType: Record<string, AssignmentStack> = {
  frontend: "Front End",
  backend: "Back End",
  "product design": "Product Design",
  general: "Front End", // Default to Front End for general
};

const assignmentTypeByStack: Record<string, string> = {
  "Front End": "frontend",
  "Back End": "backend",
  "Product Design": "product design",
  General: "general",
};

// Splits a stored dueDateTime into the local date/time strings the API expects back,
// matching how the backend reassembles them (new Date(y, m - 1, d, h, min)).
const splitDueDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { deadline: "", deadlineTime: "23:59" };
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    deadline: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    deadlineTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
};

// Declared at module scope so the rich-text editor is not remounted (and does not
// lose focus) on every keystroke in the surrounding form.
function TaskFormFields({
  value,
  onChange,
  mode,
}: {
  value: TaskFormData;
  onChange: (updater: (prev: TaskFormData) => TaskFormData) => void;
  mode: "create" | "edit";
}) {
  const idPrefix = mode === "edit" ? "editTask" : "newTask";
  const { totalWeeks } = useProgramSettings();

  return (
    <div className="space-y-5 py-4">
      {/* Task Title */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}Title`} className="text-sm font-medium">
          Task Title
        </Label>
        <Input
          id={`${idPrefix}Title`}
          placeholder="Enter task title"
          value={value.title}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, title: e.target.value }))
          }
          className="h-12"
        />
      </div>

      {/* Task Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
        <RichTextEditor
          value={value.description}
          onChange={(html) =>
            onChange((prev) => ({ ...prev, description: html }))
          }
          placeholder="Describe the objective, the tasks and the submission rules…"
        />
        <p className="text-xs text-muted-foreground">
          Use headings, lists and code blocks — students see the task exactly as
          you format it here.
        </p>
      </div>

      {/* Assignment Type */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Assign To</Label>
        <div className="flex flex-wrap gap-2">
          {assignmentTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                onChange((prev) => ({ ...prev, assignmentType: type }))
              }
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                value.assignmentType === type
                  ? "bg-[#ffb703] text-[#08022b] border-[#ffb703]"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Week */}
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}Week`} className="text-sm font-medium">
          Week
        </Label>
        <Input
          id={`${idPrefix}Week`}
          type="number"
          min="1"
          max={totalWeeks}
          placeholder={`Enter week number (1-${totalWeeks})`}
          value={value.week}
          // The API does not accept a week change on update, and the deadline is
          // validated against the week only at creation time.
          disabled={mode === "edit"}
          onChange={(e) =>
            onChange((prev) => ({ ...prev, week: e.target.value }))
          }
          className="h-12 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {mode === "edit" && (
          <p className="text-xs text-muted-foreground">
            The week cannot be changed after a task is created.
          </p>
        )}
      </div>

      {/* Deadline Date & Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Deadline</Label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id={`${idPrefix}Deadline`}
            type="date"
            value={value.deadline}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, deadline: e.target.value }))
            }
            className="h-12 flex-1"
          />
          <Input
            id={`${idPrefix}DeadlineTime`}
            type="time"
            value={value.deadlineTime}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, deadlineTime: e.target.value }))
            }
            className="h-12 w-full sm:w-32"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Deadline must be within the specified week (Sunday 23:59 of the week)
        </p>
      </div>

      {/* Allow Late Submissions Toggle */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
        <div className="space-y-0.5">
          <Label
            htmlFor={`${idPrefix}AllowLate`}
            className="text-sm font-medium"
          >
            Allow Late Submissions
          </Label>
          <p className="text-xs text-muted-foreground">
            Students can submit after the deadline
          </p>
        </div>
        <button
          id={`${idPrefix}AllowLate`}
          type="button"
          role="switch"
          aria-checked={value.allowLateSubmission}
          onClick={() =>
            onChange((prev) => ({
              ...prev,
              allowLateSubmission: !prev.allowLateSubmission,
            }))
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value.allowLateSubmission ? "bg-[#ffb703]" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value.allowLateSubmission ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// Student Assessment View Component - with Tasks, Review, Submissions tabs
function StudentAssessmentView({
  studentName,
  studentId,
  studentStack,
  isAdminViewing = false,
  onBack,
}: {
  studentName?: string;
  studentId?: string;
  studentStack?: string;
  isAdminViewing?: boolean;
  onBack?: () => void;
}) {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const [commentsInput, setCommentsInput] = useState("");

  // Real data states
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  // null until the program settings arrive, so the picker can default to the
  // configured current week without clobbering a selection the user has made.
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const { currentWeek, totalWeeks, isLoaded } = useProgramSettings();
  const weekOptions = useMemo(() => buildWeekOptions(totalWeeks), [totalWeeks]);

  // Wait for the settings to settle before seeding, so the picker does not latch
  // onto the placeholder week 1 while the real value is still in flight.
  useEffect(() => {
    if (!isLoaded) return;
    setSelectedWeek((week) => week ?? currentWeek);
  }, [isLoaded, currentWeek]);

  // Task submission modal state (for students)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskSubmitModalOpen, setIsTaskSubmitModalOpen] = useState(false);
  const [submissionLink, setSubmissionLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  // Which task card has its full description expanded
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Task deletion state (admin only)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [assignmentsRefreshKey, setAssignmentsRefreshKey] = useState(0);

  // Performance review (Review tab) state
  const [performanceRatings, setPerformanceRatings] = useState<
    PerformanceReviewRating[]
  >([]);
  const [currentWeekBreakdown, setCurrentWeekBreakdown] =
    useState<PerformanceReviewRating | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  // Fetch assignments and submissions
  useEffect(() => {
    // Wait for the program settings to resolve the default week, so the first
    // fetch is not wasted on a week the user is about to be moved off.
    if (selectedWeek === null) return;

    const fetchData = async () => {
      console.log(
        "[DEBUG] fetchData - isAdminViewing:",
        isAdminViewing,
        "user:",
        user,
        "user?.stack:",
        user?.stack,
      );
      setIsLoadingAssignments(true);
      setIsLoadingSubmissions(true);

      try {
        if (isAdminViewing && studentStack) {
          // Admin viewing: fetch assignments for student's stack
          const normalizedStack = normalizeStackForApi(studentStack);
          const assignmentsData = await getAllAssignmentsByWeek(
            selectedWeek,
            normalizedStack,
          );
          setAssignments(assignmentsData.assignments || []);
        } else if (!isAdminViewing && user?.stack) {
          // Student viewing: fetch their stack's assignments
          const normalizedStack = normalizeStackForApi(user.stack);
          const assignmentsData = await getAssignmentsByWeek(
            selectedWeek,
            normalizedStack,
          );
          setAssignments(assignmentsData.assignments || []);
        }
      } catch (error) {
        console.error("Failed to fetch assignments:", error);
        toast.error("Failed to load assignments");
      } finally {
        setIsLoadingAssignments(false);
      }

      // Fetch submissions for students to determine task status
      try {
        if (!isAdminViewing && user?.id) {
          const submissionsData = await getStudentSubmissions(
            user.id,
            selectedWeek,
          );
          setSubmissions(submissionsData.submissions || []);
        } else if (studentId) {
          const submissionsData = await getStudentSubmissions(
            studentId,
            selectedWeek,
          );
          setSubmissions(submissionsData.submissions || []);
        }
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
      } finally {
        setIsLoadingSubmissions(false);
      }
    };

    fetchData();
  }, [
    selectedWeek,
    isAdminViewing,
    studentStack,
    studentId,
    user,
    assignmentsRefreshKey,
  ]);

  // Collapse any open task description when the week's task list changes
  useEffect(() => {
    setExpandedTaskId(null);
  }, [selectedWeek]);

  // Fetch submissions on initial mount if submissions tab is active
  useEffect(() => {
    if (selectedWeek === null) return;

    if (activeTab === "submissions") {
      const fetchSubmissions = async () => {
        setIsLoadingSubmissions(true);
        try {
          if (!isAdminViewing && user?.id) {
            const submissionsData = await getStudentSubmissions(
              user.id,
              selectedWeek,
            );
            setSubmissions(submissionsData.submissions || []);
          } else if (studentId) {
            const submissionsData = await getStudentSubmissions(
              studentId,
              selectedWeek,
            );
            setSubmissions(submissionsData.submissions || []);
          }
        } catch (error) {
          console.error("Failed to fetch submissions:", error);
          toast.error("Failed to load submissions");
        } finally {
          setIsLoadingSubmissions(false);
        }
      };
      fetchSubmissions();
    }
  }, [activeTab, selectedWeek, isAdminViewing, studentId]);

  // Fetch performance review data when the Review tab is opened
  useEffect(() => {
    if (activeTab !== "review") return;

    const targetStudentId = isAdminViewing ? studentId : user?.id;
    if (!targetStudentId) return;

    let cancelled = false;
    const fetchReview = async () => {
      setIsLoadingReview(true);
      try {
        const data = await getStudentPerformanceReview(targetStudentId);
        if (cancelled) return;

        const ratings = data.ratings ?? data.performanceReview ?? [];
        const sorted = [...ratings].sort((a, b) => b.week - a.week);
        setPerformanceRatings(sorted);
        setCurrentWeekBreakdown(
          data.currentWeekBreakdown ?? sorted[0] ?? null,
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch performance review:", error);
          toast.error("Failed to load performance review");
          setPerformanceRatings([]);
          setCurrentWeekBreakdown(null);
        }
      } finally {
        if (!cancelled) setIsLoadingReview(false);
      }
    };

    fetchReview();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isAdminViewing, studentId, user?.id]);

  // Convert API assignments to Task format
  const tasks: Task[] = assignments.map((assignment) => {
    // Check if there's a submission for this assignment
    const submission = submissions.find(
      (s) =>
        typeof s.assignment === "object" && s.assignment._id === assignment._id,
    );

    let status: "completed" | "pending" | "in-progress" = "pending";
    if (submission) {
      status = submission.grade !== null ? "completed" : "in-progress";
    }

    return {
      _id: assignment._id,
      title: assignment.title,
      description: assignment.taskDescription,
      descriptionFormat: assignment.descriptionFormat,
      dueDate: assignment.dueDateTime,
      status,
      score: submission?.grade ? submission.grade * 5 : undefined, // Convert 0-20 to 0-100
      assignment,
    };
  });

  // Convert API submissions to Submission format
  const mySubmissions: Submission[] = submissions.map((sub) => ({
    _id: sub._id,
    title:
      typeof sub.assignment === "object"
        ? sub.assignment.title
        : "Unknown Assignment",
    submittedDate: sub.submittedAt,
    status: sub.status ,
    score: sub.grade ? sub.grade * 5 : undefined, // Convert 0-20 to 0-100
    submissionLink: sub.submissionLink,
  }));

  const handleSubmissionClick = (submission: Submission) => {
    if (!isAdminViewing) return;
    setSelectedSubmission(submission);
    setScoreInput(submission.score?.toString() || "");
    setCommentsInput(submission.comments || "");
    setIsScoreModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    // Only allow students (not admin viewing) to click on pending tasks for submission
    if (isAdminViewing) return;
    if (task.status !== "pending") return;
    setSelectedTask(task);
    setSubmissionLink("");
    setIsTaskSubmitModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeletingTask(true);
    try {
      await deleteAssignment(taskToDelete._id);
      toast.success("Task deleted successfully");
      setTaskToDelete(null);
      // Re-run the week fetch so the deleted task (and its submissions) drop out
      setAssignmentsRefreshKey((key) => key + 1);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to delete task:", error);
      toast.error(apiError.message || "Failed to delete task");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleTaskSubmit = async () => {
    if (!submissionLink.trim()) {
      toast.error("Please enter a submission link");
      return;
    }
    if (!selectedTask?.assignment) {
      toast.error("Invalid task selected");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAssignment(selectedTask.assignment._id, {
        submissionLink: submissionLink.trim(),
      });
      toast.success(`Task "${selectedTask?.title}" submitted successfully!`);
      setIsTaskSubmitModalOpen(false);
      setSelectedTask(null);
      setSubmissionLink("");
      // Refresh submissions
      if (user?.id) {
        const submissionsData = await getStudentSubmissions(user.id);
        setSubmissions(submissionsData.submissions || []);
      }
    } catch (error) {
      const apiError = error as ApiError;
      const message =
        apiError.message || "Failed to submit assignment. Please try again.";
      console.error(`Failed to submit assignment: ${message}`);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseTaskModal = () => {
    setIsTaskSubmitModalOpen(false);
    setSelectedTask(null);
    setSubmissionLink("");
  };

  const handleSaveScore = async () => {
    const score = parseInt(scoreInput, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Please enter a valid score between 0 and 100");
      return;
    }

    // Convert 0-100 score to 0-20 for API
    const apiGrade = Math.round(score / 5);

    if (!selectedSubmission?._id || !isAdminViewing) {
      // For non-admin or mock data, just show success
      toast.success(`Score saved for ${selectedSubmission?.title}`);
      setIsScoreModalOpen(false);
      setSelectedSubmission(null);
      setScoreInput("");
      setCommentsInput("");
      return;
    }

    setIsGrading(true);
    try {
      await gradeSubmission(selectedSubmission._id, apiGrade);
      toast.success(`Score saved for ${selectedSubmission?.title}`);
      setIsScoreModalOpen(false);
      setSelectedSubmission(null);
      setScoreInput("");
      setCommentsInput("");
    } catch (error) {
      console.error("Failed to save grade:", error);
      toast.error("Failed to save grade. Please try again.");
    } finally {
      setIsGrading(false);
    }
  };

  const handleCloseModal = () => {
    setIsScoreModalOpen(false);
    setSelectedSubmission(null);
    setScoreInput("");
    setCommentsInput("");
  };

  // Handle tab change - fetch submissions when submissions tab is clicked
  const handleTabChange = async (value: string) => {
    setActiveTab(value);

    if (value === "submissions") {
      const week = selectedWeek ?? currentWeek;
      setIsLoadingSubmissions(true);
      try {
        if (!isAdminViewing && user?.id) {
          const submissionsData = await getStudentSubmissions(user.id, week);
          setSubmissions(submissionsData.submissions || []);
        } else if (studentId) {
          const submissionsData = await getStudentSubmissions(studentId, week);
          setSubmissions(submissionsData.submissions || []);
        }
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
        toast.error("Failed to load submissions");
      } finally {
        setIsLoadingSubmissions(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "graded":
        return "bg-[#34a853]/10 text-[#34a853]";
      case "in-progress":
        return "bg-[#ffb703]/10 text-[#ffb703]";
      case "pending":
        return "bg-gray-100 text-gray-600";
      case "late":
        return "bg-[#ec1c24]/10 text-[#ec1c24]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-4">
          {isAdminViewing && onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10 shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-foreground">
              {isAdminViewing ? `Task Board - ${studentName}` : "My Assessments"}
            </h1>
            {isAdminViewing && (
              <p className="text-sm text-muted-foreground">
                Viewing student progress and submissions
              </p>
            )}
          </div>
        </div>
        {/* Week Selector */}
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Label
            htmlFor="week-select"
            className="text-sm font-medium whitespace-nowrap"
          >
            Week:
          </Label>
          <select
            id="week-select"
            value={selectedWeek ?? currentWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
          >
            {weekOptions.map((week) => (
              <option key={week} value={week}>
                Week {week}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Student Info Card (only for admin viewing) */}
      {isAdminViewing && (
        <Card className="border-none shadow-sm bg-gradient-to-r from-[#ffb703]/5 to-transparent">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-[#ffb703]">
                <AvatarImage
                  src={`/placeholder.svg?height=56&width=56&query=student%20${studentId}`}
                />
                <AvatarFallback className="bg-[#ffb703] text-lg">
                  {studentName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground text-lg">
                  {studentName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {studentStack || "Frontend Development"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Review</span>
          </TabsTrigger>
          <TabsTrigger value="submissions" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Submissions</span>
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Assigned Tasks</CardTitle>
              <CardDescription>
                Complete your weekly tasks and projects
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAssignments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No assignments found for week {selectedWeek ?? currentWeek}.</p>
                  <p className="text-sm mt-2">
                    Check back later for new tasks.
                  </p>
                </div>
              ) : (
                tasks.map((task) => {
                  const isExpanded = expandedTaskId === task._id;
                  // Only offer the toggle when the preview actually hides something.
                  const isExpandable =
                    richTextToPlain(task.description, task.descriptionFormat)
                      .length > 140;

                  return (
                    <div
                      key={task._id}
                      onClick={() => handleTaskClick(task)}
                      className={`flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-border rounded-lg hover:bg-gray-50/50 transition-colors gap-3 ${
                        !isAdminViewing && task.status === "pending"
                          ? "cursor-pointer hover:border-[#ffb703]/50"
                          : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium text-foreground">
                            {task.title}
                          </h4>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.charAt(0).toUpperCase() +
                              task.status.slice(1).replace("-", " ")}
                          </Badge>
                        </div>
                        <div className="mt-1">
                          <RichText
                            content={task.description}
                            format={task.descriptionFormat}
                            clamp={isExpanded || !isExpandable ? undefined : 2}
                          />
                        </div>
                        <div className="flex items-center gap-3 flex-wrap mt-2">
                          {isExpandable && (
                            <button
                              type="button"
                              onClick={(e) => {
                                // The card itself opens the submit modal.
                                e.stopPropagation();
                                setExpandedTaskId(isExpanded ? null : task._id);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-medium text-[#219ebc] hover:underline"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                              {isExpanded ? "Hide details" : "View details"}
                            </button>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {(task.score || isAdminViewing) && (
                        <div className="flex items-center gap-3 sm:justify-end">
                          {task.score && (
                            <span className="text-2xl font-bold text-[#34a853]">
                              {task.score}%
                            </span>
                          )}
                          {isAdminViewing && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${task.title}`}
                              className="h-8 w-8 text-[#ec1c24] hover:bg-[#ec1c24]/10 hover:text-[#ec1c24]"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskToDelete(task);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Performance Review</CardTitle>
              <CardDescription>
                {isAdminViewing
                  ? "Weekly assessments and feedback for this student"
                  : "Your weekly assessments and feedback"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReview ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
                </div>
              ) : performanceRatings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No performance reviews available yet.</p>
                  <p className="text-sm mt-2">
                    Weekly ratings will appear here once they have been
                    submitted.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Week</TableHead>
                        <TableHead>Assessment</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Date
                        </TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceRatings.map((rating) => {
                        const total = computeRatingTotal(rating);
                        const status: "graded" | "pending" =
                          rating.status === "pending" || total === null
                            ? "pending"
                            : "graded";
                        const dateStr = rating.createdAt
                          ? new Date(rating.createdAt).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "-";
                        return (
                          <TableRow
                            key={rating._id ?? `week-${rating.week}`}
                          >
                            <TableCell className="font-medium">
                              Week {rating.week}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate sm:max-w-none">
                              {rating.title ||
                                rating.assessmentTitle ||
                                `Week ${rating.week} Assessment`}
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground sm:table-cell">
                              {dateStr}
                            </TableCell>
                            <TableCell>
                              {total !== null ? (
                                <span className="font-semibold text-[#34a853]">
                                  {total}%
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {status === "graded" ? (
                                <Badge className="bg-[#34a853]/10 text-[#34a853]">
                                  Graded
                                </Badge>
                              ) : (
                                <Badge className="bg-[#ffb703]/10 text-[#ffb703]">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Grade Breakdown */}
              {!isLoadingReview && currentWeekBreakdown && (
                <div className="mt-8">
                  <h4 className="font-semibold mb-4">
                    Week {currentWeekBreakdown.week} Grade Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">
                        Punctuality
                      </p>
                      <p className="text-lg font-semibold text-[#34a853]">
                        {formatBreakdownValue(
                          currentWeekBreakdown.punctuality,
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">
                        Attendance
                      </p>
                      <p className="text-lg font-semibold text-[#34a853]">
                        {formatBreakdownValue(
                          currentWeekBreakdown.classParticipation,
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">
                        Class Task
                      </p>
                      <p className="text-lg font-semibold text-[#34a853]">
                        {formatBreakdownValue(
                          currentWeekBreakdown.classAssessment,
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">
                        Assignments
                      </p>
                      <p className="text-lg font-semibold text-[#34a853]">
                        {formatBreakdownValue(
                          currentWeekBreakdown.Assignments,
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Defence</p>
                      <p className="text-lg font-semibold text-[#34a853]">
                        {formatBreakdownValue(
                          currentWeekBreakdown.personalDefense,
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-[#ffb703]/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold text-[#ffb703]">
                        {computeRatingTotal(currentWeekBreakdown) !== null
                          ? `${computeRatingTotal(currentWeekBreakdown)}%`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
              <CardDescription>
                Track your submitted work and feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSubmissions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
                </div>
              ) : mySubmissions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No submissions yet.</p>
                  <p className="text-sm mt-2">
                    Submit your first assignment from the Tasks tab.
                  </p>
                </div>
              ) : (
                mySubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    onClick={() => handleSubmissionClick(submission)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50/50 transition-colors gap-3 ${
                      isAdminViewing
                        ? "cursor-pointer hover:border-[#ffb703]/50"
                        : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground">
                          {submission.title}
                        </h4>
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status.charAt(0).toUpperCase() +
                            submission.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted:{" "}
                        {new Date(
                          submission.submittedDate,
                        ).toLocaleDateString()}
                      </p>
                      {submission.submissionLink && (
                        <a
                          href={submission.submissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#ffb703] hover:underline mt-1 block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Submission →
                        </a>
                      )}
                      {submission.feedback && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          "{submission.feedback}"
                        </p>
                      )}
                    </div>
                    {submission.score && (
                      <div className="text-right">
                        <span className="text-2xl font-bold text-[#34a853]">
                          {submission.score}%
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submission Scoring Modal */}
      <Dialog open={isScoreModalOpen} onOpenChange={setIsScoreModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Grade Submission</DialogTitle>
            <DialogDescription>
              Assign a score for {selectedSubmission?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Student Info */}
            {isAdminViewing && studentName && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-10 w-10 ring-2 ring-[#ffb703]">
                  <AvatarImage
                    src={`/placeholder.svg?height=40&width=40&query=student%20${studentId}`}
                  />
                  <AvatarFallback className="bg-[#ffb703] text-sm">
                    {studentName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{studentName}</p>
                  <p className="text-xs text-muted-foreground">
                    Frontend Development
                  </p>
                </div>
              </div>
            )}

            {/* Submission Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  className={
                    selectedSubmission
                      ? getStatusColor(selectedSubmission.status)
                      : ""
                  }
                >
                  {selectedSubmission?.status.charAt(0).toUpperCase() +
                    (selectedSubmission?.status.slice(1) || "")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Submitted</span>
                <span className="text-sm font-medium">
                  {selectedSubmission
                    ? new Date(
                        selectedSubmission.submittedDate,
                      ).toLocaleDateString()
                    : ""}
                </span>
              </div>
              {selectedSubmission?.score && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Score
                  </span>
                  <span className="text-sm font-bold text-[#34a853]">
                    {selectedSubmission.score}%
                  </span>
                </div>
              )}
            </div>

            {/* Score Input */}
            <div className="space-y-2">
              <Label htmlFor="score" className="text-sm font-medium">
                Submission Score (0-100)
              </Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                placeholder="Enter score percentage"
                value={scoreInput}
                onChange={(e) => setScoreInput(e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Enter a value between 0 and 100
              </p>
            </div>

            {/* Comments */}
            <div className="space-y-2">
              <Label htmlFor="comments" className="text-sm font-medium">
                Instructor Comments
              </Label>
              <textarea
                id="comments"
                placeholder="Enter feedback or comments for the student..."
                value={commentsInput}
                onChange={(e) => setCommentsInput(e.target.value)}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
              />
              <p className="text-xs text-muted-foreground">
                Provide constructive feedback to help the student improve
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={isGrading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveScore}
              disabled={isGrading}
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              {isGrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Score"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Submission Modal (for students) */}
      <Dialog
        open={isTaskSubmitModalOpen}
        onOpenChange={setIsTaskSubmitModalOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Submit Task</DialogTitle>
            <DialogDescription>
              Review task details and submit your completed work
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Task Info */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="font-semibold text-foreground">
                  {selectedTask?.title}
                </h4>
                <Badge
                  className={
                    selectedTask ? getStatusColor(selectedTask.status) : ""
                  }
                >
                  {selectedTask?.status.charAt(0).toUpperCase() +
                    (selectedTask?.status.slice(1).replace("-", " ") || "")}
                </Badge>
              </div>
              <div className="max-h-[240px] overflow-y-auto pr-1">
                <RichText
                  content={selectedTask?.description}
                  format={selectedTask?.descriptionFormat}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Due:{" "}
                  {selectedTask
                    ? new Date(selectedTask.dueDate).toLocaleDateString()
                    : ""}
                </span>
              </div>
            </div>

            {/* Submission Link Input */}
            <div className="space-y-2">
              <Label htmlFor="submissionLink" className="text-sm font-medium">
                Submission Link
              </Label>
              <Input
                id="submissionLink"
                type="url"
                placeholder="https://github.com/yourusername/your-repo or https://..."
                value={submissionLink}
                onChange={(e) => setSubmissionLink(e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Paste the link to your completed task (GitHub, CodePen, hosted
                site, etc.)
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={handleCloseTaskModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTaskSubmit}
              disabled={isSubmitting}
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Task Confirmation (admin only) */}
      <Dialog
        open={taskToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTaskToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              {taskToDelete ? deleteAssignmentWarning(taskToDelete.title) : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTaskToDelete(null)}
              disabled={isDeletingTask}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ec1c24] text-white hover:bg-[#ec1c24]/90"
              onClick={handleDeleteTask}
              disabled={isDeletingTask}
            >
              {isDeletingTask ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Admin Assessment View Component
function AdminAssessmentView() {
  const router = useRouter();
  const [adminSection, setAdminSection] = usePersistedState(
    "thecurve:assessments:admin-section",
    "students",
    adminSections,
  );
  const [activeTab, setActiveTab] = usePersistedState(
    "thecurve:assessments:admin-stack",
    "Front-End",
    stackTabs,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Assignment (task) board state
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  // null until the program settings arrive; the effect below seeds it with the
  // configured current week without overriding a filter the tutor has changed.
  const [taskWeek, setTaskWeek] = useState<"all" | number | null>(null);
  const [taskStack, setTaskStack] = useState<"all" | AssignmentStack>("all");
  const [taskDue, setTaskDue] = useState<DueFilter>("all");
  const [taskSearch, setTaskSearch] = useState("");
  const [assignmentToDelete, setAssignmentToDelete] =
    useState<Assignment | null>(null);
  const [isDeletingAssignment, setIsDeletingAssignment] = useState(false);

  // Per-assignment submissions dialog
  const [submissionsAssignment, setSubmissionsAssignment] =
    useState<Assignment | null>(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<
    GradingSubmission[]
  >([]);
  const [isLoadingAssignmentSubmissions, setIsLoadingAssignmentSubmissions] =
    useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // const [students, setStudents] = useState<StudentAssessment[]>(
  //   mockStudentAssessments,
  // );
  const [students, setStudents] = useState<StudentAssessment[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentAssessment | null>(null);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [showUploadTaskDialog, setShowUploadTaskDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<ExcelPreview | null>(null);
  const [excelParseError, setExcelParseError] = useState<string | null>(null);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [isBulkDragActive, setIsBulkDragActive] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(emptyTaskForm);

  // Edit task state (tutors only)
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(
    null,
  );
  const [editTaskFormData, setEditTaskFormData] =
    useState<TaskFormData>(emptyTaskForm);
  const [isSavingTask, setIsSavingTask] = useState(false);

  const [gradeData, setGradeData] = useState({
    punctuality: "20",
    attendance: "20",
    classTask: "20",
    assignments: "20",
    personalDefence: "20",
    week: "",
  });

  const { currentWeek, totalWeeks, isLoaded } = useProgramSettings();
  const weekOptions = useMemo(() => buildWeekOptions(totalWeeks), [totalWeeks]);

  // Seed the week-dependent defaults once the program settings have settled —
  // seeding earlier would latch onto the placeholder week 1.
  useEffect(() => {
    if (!isLoaded) return;
    setTaskWeek((week) => week ?? currentWeek);
    setGradeData((prev) =>
      prev.week ? prev : { ...prev, week: String(currentWeek) },
    );
  }, [isLoaded, currentWeek]);
  const [isUploadingTask, setIsUploadingTask] = useState(false);

  const resetBulkUploadState = useCallback(() => {
    setSelectedExcelFile(null);
    setExcelPreview(null);
    setExcelParseError(null);
    setIsParsingExcel(false);
    setIsUploadingExcel(false);
    setIsBulkDragActive(false);
  }, []);

  const handleBulkUploadDialogChange = (open: boolean) => {
    setShowBulkUploadDialog(open);
    if (!open) {
      resetBulkUploadState();
    }
  };

  const processExcelFile = useCallback(async (file: File) => {
    if (!isExcelFile(file)) {
      toast.error("Please select an Excel file (.xlsx or .xls)");
      return;
    }

    setSelectedExcelFile(file);
    setExcelPreview(null);
    setExcelParseError(null);
    setIsParsingExcel(true);

    try {
      const preview = await parseExcelPreview(file);
      setExcelPreview(preview);
    } catch (error) {
      console.error("Failed to parse Excel file:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to read the Excel file. Please try another file.";
      setExcelParseError(message);
      toast.error(message);
    } finally {
      setIsParsingExcel(false);
    }
  }, []);

  const handleExcelFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      void processExcelFile(file);
    }
  };

  const handleBulkDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsBulkDragActive(true);
    } else if (event.type === "dragleave") {
      setIsBulkDragActive(false);
    }
  };

  const handleBulkDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsBulkDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void processExcelFile(file);
    }
  };

  // Fetch students from API
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get<{ data: StudentRecord[] }>(
        "/users/students",
      );
      const result = response.data.data || [];

      // Filter by active tab stack and search query
      // Normalize strings for flexible matching (handles: frontend, front-end, front end, etc.)
      const normalize = (str: string) =>
        str.toLowerCase().replace(/[-\s]/g, "");

      const isFrontend = (stack: string) => {
        const n = normalize(stack);
        return n.includes("front") || n.includes("frontend");
      };
      const isBackend = (stack: string) => {
        const n = normalize(stack);
        return n.includes("back") || n.includes("backend");
      };
      const isProductDesign = (stack: string) => {
        const n = normalize(stack);
        return n.includes("product") || n.includes("design");
      };

      const filtered = result.filter((student) => {
        const matchesStack =
          (activeTab === "Front-End" && isFrontend(student.stack)) ||
          (activeTab === "Back-End" && isBackend(student.stack)) ||
          (activeTab === "Product Design" && isProductDesign(student.stack));
        const matchesSearch = searchQuery
          ? student.name.toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        return matchesStack && matchesSearch;
      });

      // Map to assessment format
      const mapped = filtered.map((student, index) => ({
        _id: student._id,
        name: student.name,
        stack:
          activeTab === "Front-End"
            ? "Frontend Development"
            : activeTab === "Back-End"
              ? "Backend Development"
              : "Product Design",
        week: student.weeklyRating ? currentWeek : null,
        hasCheck: student.weeklyRating !== null,
        avgPercent: student.overallRating ? `${student.overallRating}%` : null,
        avatar: `/placeholder.svg?height=40&width=40&query=student%20${index + 1}`,
      }));

      setStudents(mapped);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      // Fallback to local filter
      const filtered = students.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setStudents(filtered);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeTab, currentWeek]);

  useEffect(() => {
    if (adminSection !== "students") return;
    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchStudents, adminSection]);

  // Fetch every assignment across all weeks and stacks. This endpoint takes no
  // query params, so filtering below happens in memory rather than by refetching.
  const fetchAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    try {
      const data = await getAllAssignments();
      setAssignments(data.assignments || []);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to fetch assignments:", error);
      toast.error(apiError.message || "Failed to load tasks");
      setAssignments([]);
    } finally {
      setIsLoadingAssignments(false);
    }
  }, []);

  useEffect(() => {
    if (adminSection !== "tasks") return;
    fetchAssignments();
  }, [adminSection, fetchAssignments]);

  const filteredAssignments = useMemo(() => {
    const query = taskSearch.trim().toLowerCase();

    return assignments
      .filter((assignment) => {
        // null means the settings have not landed yet — do not filter on week.
        if (taskWeek !== "all" && taskWeek !== null && assignment.week !== taskWeek)
          return false;
        if (taskStack !== "all" && assignment.stack !== taskStack) return false;

        if (taskDue !== "all") {
          const overdue = isOverdue(assignment);
          if (taskDue === "overdue" && !overdue) return false;
          if (taskDue === "upcoming" && overdue) return false;
        }

        if (query) {
          // Match on the description's text, not on its markup.
          const haystack =
            `${assignment.title} ${richTextToPlain(
              assignment.taskDescription,
              assignment.descriptionFormat,
            )}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (b.week !== a.week) return b.week - a.week;
        return (
          new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime()
        );
      });
  }, [assignments, taskWeek, taskStack, taskDue, taskSearch]);

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    setIsDeletingAssignment(true);
    try {
      await deleteAssignment(assignmentToDelete._id);
      toast.success("Task deleted successfully");
      setAssignmentToDelete(null);
      await fetchAssignments();
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to delete assignment:", error);
      toast.error(apiError.message || "Failed to delete task");
    } finally {
      setIsDeletingAssignment(false);
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSubmissionsAssignment(assignment);
    setAssignmentSubmissions([]);
    setIsLoadingAssignmentSubmissions(true);
    try {
      const data = await getSubmissionsByAssignment(assignment._id);
      setAssignmentSubmissions(data.submissions || []);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to fetch submissions for assignment:", error);
      toast.error(apiError.message || "Failed to load submissions");
    } finally {
      setIsLoadingAssignmentSubmissions(false);
    }
  };

  const handleBulkExcelUpload = async () => {
    if (!selectedExcelFile) {
      toast.error("Please select an Excel file");
      return;
    }

    if (excelParseError) {
      toast.error("Fix the file preview error before uploading.");
      return;
    }

    setIsUploadingExcel(true);
    try {
      const response = await uploadRatingsExcel(selectedExcelFile);
      toast.success(response.message || "Ratings uploaded successfully!");
      setShowBulkUploadDialog(false);
      resetBulkUploadState();
      await fetchStudents();
    } catch (error) {
      console.error("Failed to upload Excel file:", error);
      const apiError = error as ApiError;
      let message =
        apiError.message || "Failed to upload Excel file. Please try again.";

      if (apiError.errors) {
        const firstFieldError = Object.values(apiError.errors)[0]?.[0];
        if (firstFieldError) {
          message = `${message} ${firstFieldError}`;
        }
      }

      toast.error(message);
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const handleGradeStudent = (student: StudentAssessment) => {
    setSelectedStudent(student);
    setShowGradeDialog(true);
  };

  const handleTaskBoard = (student: StudentAssessment) => {
    // Navigate to task board page with student info including stack
    router.push(
      `/assessments?studentId=${student._id}&studentName=${encodeURIComponent(student.name)}&studentStack=${encodeURIComponent(student.stack)}`,
    );
  };

  const handleReviewAttendance = (student: StudentAssessment) => {
    // Navigate to checkin page with student ID as query param
    router.push(`/checkin/${student._id}`);
  };

  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const handleSaveGrade = async () => {
    if (!selectedStudent) return;

    const weekNum = parseInt(gradeData.week, 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > totalWeeks) {
      toast.error(`Please enter a week number between 1 and ${totalWeeks}`);
      return;
    }

    setIsSavingGrade(true);
    try {
      await addStudentRating(selectedStudent._id, {
        punctuality: parseInt(gradeData.punctuality, 10) || 0,
        Assignments: parseInt(gradeData.assignments, 10) || 0,
        classParticipation: parseInt(gradeData.attendance, 10) || 0,
        classAssessment: parseInt(gradeData.classTask, 10) || 0,
        personalDefense: parseInt(gradeData.personalDefence, 10) || 0,
        week: weekNum,
      });

      toast.success("Grade saved successfully!");
      setShowGradeDialog(false);
      setSelectedStudent(null);
      setGradeData({
        punctuality: "20",
        attendance: "20",
        classTask: "20",
        assignments: "20",
        personalDefence: "20",
        week: String(currentWeek),
      });
    } catch (error) {
      console.error("Failed to save grade:", error);
      toast.error("Failed to save grade. Please try again.");
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleUploadTask = async () => {
    if (
      !taskFormData.title ||
      // The editor emits "<p></p>" for an empty document, which is truthy.
      isRichTextEmpty(taskFormData.description) ||
      !taskFormData.deadline ||
      !taskFormData.week
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate week number
    const weekNum = parseInt(taskFormData.week, 10);
    if (isNaN(weekNum) || weekNum < 1 || weekNum > totalWeeks) {
      toast.error(`Please enter a week number between 1 and ${totalWeeks}`);
      return;
    }

    setIsUploadingTask(true);
    try {
      await createAssignment({
        week: weekNum,
        title: taskFormData.title,
        taskDescription: taskFormData.description,
        descriptionFormat: "html",
        stack: stackByAssignmentType[taskFormData.assignmentType] || "Front End",
        dueDate: taskFormData.deadline,
        dueTime: taskFormData.deadlineTime,
        allowLateSubmissions: taskFormData.allowLateSubmission,
      });

      toast.success(`Task "${taskFormData.title}" uploaded successfully!`);
      setShowUploadTaskDialog(false);
      setTaskFormData(emptyTaskForm);
      // Keep the task board in sync with the newly created assignment
      await fetchAssignments();
    } catch (error) {
      console.error("Failed to upload task:", error);
      toast.error("Failed to upload task. Please try again.");
    } finally {
      setIsUploadingTask(false);
    }
  };

  const handleOpenEditTask = (assignment: Assignment) => {
    const { deadline, deadlineTime } = splitDueDateTime(assignment.dueDateTime);

    setEditTaskFormData({
      title: assignment.title,
      // A legacy plain-text task is lifted into paragraphs so editing upgrades it
      // rather than showing its punctuation as markup.
      description: toEditorHtml(
        assignment.taskDescription,
        assignment.descriptionFormat,
      ),
      assignmentType: assignmentTypeByStack[assignment.stack] ?? "general",
      week: String(assignment.week),
      deadline,
      deadlineTime,
      allowLateSubmission: assignment.allowLateSubmissions,
    });
    setAssignmentToEdit(assignment);
  };

  const handleSaveTask = async () => {
    if (!assignmentToEdit) return;

    if (
      !editTaskFormData.title ||
      isRichTextEmpty(editTaskFormData.description) ||
      !editTaskFormData.deadline
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // The API only updates the fields it is given, so the stack is sent only when
    // the tutor actually changed it — that keeps a "General" task from being
    // rewritten to "Front End" by an untouched pill.
    const originalAssignmentType =
      assignmentTypeByStack[assignmentToEdit.stack] ?? "general";
    const stackChanged =
      editTaskFormData.assignmentType !== originalAssignmentType;

    setIsSavingTask(true);
    try {
      await updateAssignment(assignmentToEdit._id, {
        title: editTaskFormData.title,
        taskDescription: editTaskFormData.description,
        descriptionFormat: "html",
        ...(stackChanged
          ? {
              stack:
                stackByAssignmentType[editTaskFormData.assignmentType] ||
                "Front End",
            }
          : {}),
        dueDate: editTaskFormData.deadline,
        dueTime: editTaskFormData.deadlineTime,
        allowLateSubmissions: editTaskFormData.allowLateSubmission,
      });

      toast.success(`Task "${editTaskFormData.title}" updated successfully!`);
      setAssignmentToEdit(null);
      await fetchAssignments();
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to update task:", error);
      toast.error(apiError.message || "Failed to update task");
    } finally {
      setIsSavingTask(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground">Student Assessment</h1>

      {/* Section Switch: student roster vs. assignment board */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-4">
        {adminSections.map((section) => (
          <button
            key={section}
            onClick={() => setAdminSection(section)}
            className={`rounded-full px-5 py-2 text-sm font-medium capitalize transition-colors ${
              adminSection === section
                ? "bg-[#ffb703] text-[#08022b]"
                : "bg-card text-foreground hover:bg-muted border border-border"
            }`}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Tabs and Search Row */}
      <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
        {/* Stack Tabs */}
        {adminSection === "students" && (
          <div className="flex flex-wrap gap-2">
            {stackTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#ffb703] text-[#08022b]"
                    : "bg-card text-foreground hover:bg-muted border border-border"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            onClick={() => setShowUploadTaskDialog(true)}
            className="w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] rounded-full px-6 py-2.5 font-medium flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Upload Task
          </Button>
          <Button
            onClick={() => setShowBulkUploadDialog(true)}
            className="w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] rounded-full px-6 py-2.5 font-medium flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Bulk Upload
          </Button>
        </div>

        {/* Search */}
        {adminSection === "students" && (
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
        )}
      </div>

      {/* Students Table */}
      {adminSection === "students" && (
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#ffb703]/10 hover:bg-[#ffb703]/10">
                      <TableHead className="hidden text-xs font-semibold text-foreground whitespace-nowrap md:table-cell">
                        #
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold text-foreground whitespace-nowrap md:table-cell">
                        IMAGE
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        FULL NAME(F/L)
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold text-foreground whitespace-nowrap md:table-cell">
                        STACK
                      </TableHead>
                      <TableHead className="hidden text-xs font-semibold text-foreground whitespace-nowrap md:table-cell">
                        WEEK
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                        AV%
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow
                        key={`${student._id}-${index}`}
                        className="hover:bg-gray-50/50"
                      >
                        <TableCell className="hidden py-3 text-sm text-muted-foreground md:table-cell">
                          {index + 1}
                        </TableCell>
                        <TableCell className="hidden py-3 md:table-cell">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                student.avatar ||
                                `/placeholder.svg?height=40&width=40&query=student%20${index}`
                              }
                            />
                            <AvatarFallback className="bg-[#ffb703]/20 text-xs">
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="min-w-0 py-3">
                          <span className="block truncate text-sm font-medium">
                            {student.name}
                          </span>
                        </TableCell>
                        <TableCell className="hidden py-3 text-sm text-muted-foreground md:table-cell">
                          {student.stack}
                        </TableCell>
                        <TableCell className="hidden py-3 md:table-cell">
                          {student.week && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{student.week}</span>
                              {student.hasCheck && (
                                <CheckCircle2 className="h-5 w-5 text-[#34a853]" />
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          {student.avgPercent && (
                            <span className="text-sm font-medium text-[#34a853]">
                              {student.avgPercent}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/students/${student._id}`)
                                }
                                className="bg-[#ffb703]/10 text-foreground"
                              >
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleTaskBoard(student)}
                              >
                                Task Board
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleGradeStudent(student)}
                              >
                                Grade Student
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleReviewAttendance(student)}
                              >
                                Review Attendance
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Board: filters + assignment table */}
      {adminSection === "tasks" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Label
                  htmlFor="task-week-filter"
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Week:
                </Label>
                <select
                  id="task-week-filter"
                  value={taskWeek ?? currentWeek}
                  onChange={(e) =>
                    setTaskWeek(
                      e.target.value === "all" ? "all" : Number(e.target.value),
                    )
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                >
                  <option value="all">All weeks</option>
                  {weekOptions.map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Label
                  htmlFor="task-stack-filter"
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Stack:
                </Label>
                <select
                  id="task-stack-filter"
                  value={taskStack}
                  onChange={(e) =>
                    setTaskStack(e.target.value as "all" | AssignmentStack)
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                >
                  <option value="all">All stacks</option>
                  {assignmentStacks.map((stack) => (
                    <option key={stack} value={stack}>
                      {stack}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex w-full items-center gap-2 sm:w-auto">
                <Label
                  htmlFor="task-due-filter"
                  className="text-sm font-medium whitespace-nowrap"
                >
                  Due:
                </Label>
                <select
                  id="task-due-filter"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value as DueFilter)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
                >
                  <option value="all">Any</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredAssignments.length}{" "}
                {filteredAssignments.length === 1 ? "task" : "tasks"}
              </span>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tasks"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="pl-10 bg-background border-border"
                />
              </div>
            </div>
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {isLoadingAssignments ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
                </div>
              ) : filteredAssignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>
                    {assignments.length === 0
                      ? "No tasks have been created yet."
                      : "No tasks match the current filters."}
                  </p>
                  <p className="text-sm mt-2">
                    {assignments.length === 0
                      ? "Use Upload Task to create one."
                      : "Try widening the week, stack or due filters."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#ffb703]/10 hover:bg-[#ffb703]/10">
                        <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                          WEEK
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                          TITLE
                        </TableHead>
                        <TableHead className="hidden text-xs font-semibold text-foreground whitespace-nowrap md:table-cell">
                          STACK
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                          DUE
                        </TableHead>
                        <TableHead className="hidden text-xs font-semibold text-foreground whitespace-nowrap md:table-cell">
                          LATE?
                        </TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssignments.map((assignment) => (
                        <TableRow
                          key={assignment._id}
                          className="hover:bg-gray-50/50"
                        >
                          <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                            Week {assignment.week}
                          </TableCell>
                          <TableCell className="min-w-0 py-3">
                            <span className="block truncate text-sm font-medium">
                              {assignment.title}
                            </span>
                            <RichText
                              content={assignment.taskDescription}
                              format={assignment.descriptionFormat}
                              clamp={1}
                              className="text-xs max-w-md"
                            />
                          </TableCell>
                          <TableCell className="hidden py-3 text-sm text-muted-foreground whitespace-nowrap md:table-cell">
                            {assignment.stack}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className="text-sm text-muted-foreground">
                                {assignment.formattedDueDate ||
                                  new Date(
                                    assignment.dueDateTime,
                                  ).toLocaleDateString()}
                              </span>
                              {isOverdue(assignment) && (
                                <Badge className="bg-[#ec1c24]/10 text-[#ec1c24] hover:bg-[#ec1c24]/10">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden py-3 text-sm text-muted-foreground md:table-cell">
                            {assignment.allowLateSubmissions ? "Allowed" : "—"}
                          </TableCell>
                          <TableCell className="py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleOpenEditTask(assignment)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Edit task
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleViewSubmissions(assignment)
                                  }
                                >
                                  View submissions
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setAssignmentToDelete(assignment)
                                  }
                                  className="text-[#ec1c24] focus:text-[#ec1c24]"
                                >
                                  Delete task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Task Confirmation */}
      <Dialog
        open={assignmentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setAssignmentToDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              {assignmentToDelete
                ? deleteAssignmentWarning(assignmentToDelete.title)
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setAssignmentToDelete(null)}
              disabled={isDeletingAssignment}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#ec1c24] text-white hover:bg-[#ec1c24]/90"
              onClick={handleDeleteAssignment}
              disabled={isDeletingAssignment}
            >
              {isDeletingAssignment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions for a single task */}
      <Dialog
        open={submissionsAssignment !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSubmissionsAssignment(null);
            setAssignmentSubmissions([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{submissionsAssignment?.title}</DialogTitle>
            <DialogDescription>
              Week {submissionsAssignment?.week} ·{" "}
              {submissionsAssignment?.stack} · submissions for this task
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto space-y-3 py-2">
            {isLoadingAssignmentSubmissions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
              </div>
            ) : assignmentSubmissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No submissions for this task yet.</p>
              </div>
            ) : (
              assignmentSubmissions.map((submission) => {
                const score = toDisplayScore(submission.grade);
                return (
                  <div
                    key={submission._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium">
                          {submission.student?.name || "Unknown student"}
                        </span>
                        {submission.isLate && (
                          <Badge className="bg-[#ec1c24]/10 text-[#ec1c24] hover:bg-[#ec1c24]/10">
                            Late
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted {formatSubmittedAt(submission.submittedAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-semibold ${
                          score === null
                            ? "text-muted-foreground"
                            : "text-[#34a853]"
                        }`}
                      >
                        {score === null ? "Ungraded" : `${score}%`}
                      </span>
                      {submission.submissionLink && (
                        <a
                          href={submission.submissionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ffb703] hover:text-[#fb8500]"
                          aria-label={`Open submission by ${submission.student?.name || "student"}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grade Student Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Student grading week {gradeData.week}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Enter grades for student assessment
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-4">
            <Avatar className="h-16 w-16 ring-4 ring-[#34a853]">
              <AvatarImage
                src={
                  selectedStudent?.avatar ||
                  "/placeholder.svg?height=64&width=64&query=student"
                }
              />
              <AvatarFallback className="bg-[#ffb703] text-lg">
                {selectedStudent?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label
                htmlFor="punctuality"
                className="text-xs text-muted-foreground"
              >
                Punctuality
              </Label>
              <Input
                id="punctuality"
                value={gradeData.punctuality}
                onChange={(e) =>
                  setGradeData({ ...gradeData, punctuality: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="attendance"
                className="text-xs text-muted-foreground"
              >
                Attendance
              </Label>
              <Input
                id="attendance"
                value={gradeData.attendance}
                onChange={(e) =>
                  setGradeData({ ...gradeData, attendance: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="classTask"
                className="text-xs text-muted-foreground"
              >
                Class task
              </Label>
              <Input
                id="classTask"
                value={gradeData.classTask}
                onChange={(e) =>
                  setGradeData({ ...gradeData, classTask: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="assignments"
                className="text-xs text-muted-foreground"
              >
                Assignments
              </Label>
              <Input
                id="assignments"
                value={gradeData.assignments}
                onChange={(e) =>
                  setGradeData({ ...gradeData, assignments: e.target.value })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="personalDefence"
                className="text-xs text-muted-foreground"
              >
                Personal defence
              </Label>
              <Input
                id="personalDefence"
                value={gradeData.personalDefence}
                onChange={(e) =>
                  setGradeData({
                    ...gradeData,
                    personalDefence: e.target.value,
                  })
                }
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="week" className="text-xs text-muted-foreground">
                Week
              </Label>
              <Input
                id="week"
                type="number"
                min="1"
                max={totalWeeks}
                value={gradeData.week}
                onChange={(e) =>
                  setGradeData({
                    ...gradeData,
                    week: e.target.value,
                  })
                }
                className="h-12"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse justify-center gap-2 pt-4 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowGradeDialog(false)}
              className="w-full sm:w-32"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGrade}
              disabled={isSavingGrade}
              className="w-full bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] sm:w-32"
            >
              {isSavingGrade ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Grade"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Task Dialog */}
      <Dialog
        open={showUploadTaskDialog}
        onOpenChange={setShowUploadTaskDialog}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to students
            </DialogDescription>
          </DialogHeader>

          <TaskFormFields
            value={taskFormData}
            onChange={setTaskFormData}
            mode="create"
          />

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowUploadTaskDialog(false)}
              disabled={isUploadingTask}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadTask}
              disabled={isUploadingTask}
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              {isUploadingTask ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Task"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog (tutors only) */}
      <Dialog
        open={assignmentToEdit !== null}
        onOpenChange={(open) => {
          if (!open && !isSavingTask) setAssignmentToEdit(null);
        }}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details. Students see the changes immediately.
            </DialogDescription>
          </DialogHeader>

          <TaskFormFields
            value={editTaskFormData}
            onChange={setEditTaskFormData}
            mode="edit"
          />

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setAssignmentToEdit(null)}
              disabled={isSavingTask}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveTask}
              disabled={isSavingTask}
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              {isSavingTask ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={handleBulkUploadDialogChange}>
        <DialogContent className="sm:max-w-[720px] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl">Bulk Upload</DialogTitle>
            <DialogDescription>
              Upload a single Excel file (.xlsx or .xls) to bulk import student
              ratings.
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-5 py-2">
            {!selectedExcelFile ? (
              <div
                className={`relative rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
                  isBulkDragActive
                    ? "border-[#ffb703] bg-[#ffb703]/5"
                    : "border-border hover:border-[#ffb703]/50"
                }`}
                onDragEnter={handleBulkDrag}
                onDragLeave={handleBulkDrag}
                onDragOver={handleBulkDrag}
                onDrop={handleBulkDrop}
              >
                <input
                  type="file"
                  accept={EXCEL_ACCEPT}
                  onChange={handleExcelFileInput}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffb703]/10">
                    <Upload className="h-7 w-7 text-[#ffb703]" />
                  </div>
                  <div>
                    <p className="text-base font-medium text-foreground">
                      Drag and drop an Excel file here
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      or click to browse from your computer
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports .xlsx and .xls (one file only)
                  </p>
                </div>
              </div>
            ) : (
              <div className="min-w-0 space-y-4">
                <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffb703]/10">
                      <FileSpreadsheet className="h-5 w-5 text-[#ffb703]" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {selectedExcelFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedExcelFile.size / 1024).toFixed(1)} KB
                        {excelPreview ? ` • Sheet: ${excelPreview.sheetName}` : ""}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetBulkUploadState}
                    disabled={isUploadingExcel}
                  >
                    Remove
                  </Button>
                </div>

                {isParsingExcel && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-[#ffb703]" />
                    Reading Excel file...
                  </div>
                )}

                {excelParseError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {excelParseError}
                  </div>
                )}

                {excelPreview && !isParsingExcel && (
                  <div className="min-w-0 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">
                        Preview
                      </p>
                      {excelPreview.totalRows > EXCEL_PREVIEW_ROW_LIMIT && (
                        <p className="shrink-0 text-xs text-muted-foreground">
                          Showing first {EXCEL_PREVIEW_ROW_LIMIT} of{" "}
                          {excelPreview.totalRows} rows
                        </p>
                      )}
                    </div>
                    <div className="max-h-[280px] w-full overflow-auto rounded-md border">
                      <Table className="w-max min-w-full">
                        <TableHeader>
                          <TableRow className="bg-[#ffb703]/10 hover:bg-[#ffb703]/10">
                            {excelPreview.headers.map((header, index) => (
                              <TableHead
                                key={`${header}-${index}`}
                                className="whitespace-nowrap px-3 text-xs font-semibold"
                              >
                                {header}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {excelPreview.rows.length > 0 ? (
                            excelPreview.rows.map((row, rowIndex) => (
                              <TableRow key={`preview-row-${rowIndex}`}>
                                {excelPreview.headers.map((_, colIndex) => (
                                  <TableCell
                                    key={`preview-cell-${rowIndex}-${colIndex}`}
                                    className="whitespace-nowrap px-3 text-xs"
                                  >
                                    {row[colIndex] || ""}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={excelPreview.headers.length}
                                className="py-8 text-center text-sm text-muted-foreground"
                              >
                                No data rows found in this sheet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleBulkUploadDialogChange(false)}
              disabled={isUploadingExcel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkExcelUpload}
              disabled={
                !selectedExcelFile ||
                !!excelParseError ||
                isParsingExcel ||
                isUploadingExcel
              }
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              {isUploadingExcel ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AssessmentsPage() {
  const user = useCurrentUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAdmin = user?.role === "admin";

  // Check if admin is viewing a specific student's task board
  const studentId = searchParams.get("studentId");
  const studentName = searchParams.get("studentName");
  const studentStack = searchParams.get("studentStack");

  // If admin is viewing a specific student's task board
  if (isAdmin && studentId && studentName) {
    return (
      <DashboardLayout title="Task Board">
        <StudentAssessmentView
          studentName={decodeURIComponent(studentName)}
          studentId={studentId}
          studentStack={
            studentStack ? decodeURIComponent(studentStack) : undefined
          }
          isAdminViewing={true}
          onBack={() => router.push("/assessments")}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Student Assessment">
      {isAdmin ? <AdminAssessmentView /> : <StudentAssessmentView />}
    </DashboardLayout>
  );
}
