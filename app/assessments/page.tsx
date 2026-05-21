"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useCurrentUser } from "@/lib/store/hooks";
import { toast } from "sonner";
import axiosInstance from "@/lib/api/axios";
import {
  Assignment,
  StudentSubmission,
  PerformanceReviewRating,
  getAssignmentsByWeek,
  getAllAssignmentsByWeek,
  getStudentSubmissions,
  submitAssignment,
  gradeSubmission,
  createAssignment,
  addStudentRating,
  getStudentPerformanceReview,
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

// Mock data for admin view - each student has unique ID
// const mockStudentAssessments: StudentAssessment[] = [
//   {
//     _id: "student-1",
//     name: "Emma Johnson",
//     stack: "Frontend Development",
//     week: 5,
//     hasCheck: true,
//     avgPercent: "76%",
//   },
//   {
//     _id: "student-2",
//     name: "Michael Chen",
//     stack: "Frontend Development",
//     week: 5,
//     hasCheck: true,
//     avgPercent: "82%",
//   },
//   {
//     _id: "student-3",
//     name: "Sarah Williams",
//     stack: "Frontend Development",
//     week: null,
//     hasCheck: false,
//     avgPercent: null,
//   },
//   {
//     _id: "student-4",
//     name: "David Brown",
//     stack: "Frontend Development",
//     week: 5,
//     hasCheck: true,
//     avgPercent: "79%",
//   },
//   {
//     _id: "student-5",
//     name: "Lisa Anderson",
//     stack: "Frontend Development",
//     week: null,
//     hasCheck: false,
//     avgPercent: null,
//   },
//   {
//     _id: "student-6",
//     name: "James Taylor",
//     stack: "Frontend Development",
//     week: 5,
//     hasCheck: true,
//     avgPercent: "88%",
//   },
//   {
//     _id: "student-7",
//     name: "Jennifer Martinez",
//     stack: "Frontend Development",
//     week: 5,
//     hasCheck: true,
//     avgPercent: "71%",
//   },
//   {
//     _id: "student-8",
//     name: "Robert Garcia",
//     stack: "Frontend Development",
//     week: 5,
//     hasCheck: true,
//     avgPercent: "85%",
//   },
//   {
//     _id: "student-9",
//     name: "Emily Davis",
//     stack: "Frontend Development",
//     week: 5,
//     hasCheck: true,
//     avgPercent: "92%",
//   },
//   {
//     _id: "student-10",
//     name: "Daniel Wilson",
//     stack: "Frontend Development",
//     week: 5,
//     hasCheck: true,
//     avgPercent: "78%",
//   },
//   {
//     _id: "student-11",
//     name: "Amanda Thomas",
//     stack: "Frontend Development",
//     week: null,
//     hasCheck: false,
//     avgPercent: null,
//   },
// ];

// // Mock tasks data
// const mockTasks: Task[] = [
//   {
//     _id: "1",
//     title: "Build a Responsive Landing Page",
//     description:
//       "Create a fully responsive landing page using HTML, CSS, and JavaScript",
//     dueDate: "2024-02-20",
//     status: "completed",
//     score: 85,
//   },
//   {
//     _id: "2",
//     title: "React Component Library",
//     description: "Build reusable components with proper documentation",
//     dueDate: "2024-02-25",
//     status: "completed",
//     score: 90,
//   },
//   {
//     _id: "3",
//     title: "API Integration Project",
//     description: "Integrate a REST API into a React application",
//     dueDate: "2024-03-01",
//     status: "in-progress",
//   },
//   {
//     _id: "4",
//     title: "State Management Implementation",
//     description: "Implement Redux or Zustand in an existing project",
//     dueDate: "2024-03-05",
//     status: "pending",
//   },
//   {
//     _id: "5",
//     title: "Testing with Jest",
//     description: "Write unit tests for existing components",
//     dueDate: "2024-03-10",
//     status: "pending",
//   },
// ];

// Mock submissions data
// const mockSubmissions: Submission[] = [
//   {
//     _id: "1",
//     title: "Week 1 - HTML Basics",
//     submittedDate: "2024-01-15",
//     status: "graded",
//     score: 88,
//     feedback: "Great work on semantic HTML!",
//   },
//   {
//     _id: "2",
//     title: "Week 2 - CSS Layouts",
//     submittedDate: "2024-01-22",
//     status: "graded",
//     score: 92,
//     feedback: "Excellent use of flexbox and grid",
//   },
//   {
//     _id: "3",
//     title: "Week 3 - JavaScript Fundamentals",
//     submittedDate: "2024-01-29",
//     status: "graded",
//     score: 78,
//     feedback: "Good but needs work on async/await",
//   },
//   {
//     _id: "4",
//     title: "Week 4 - React Basics",
//     submittedDate: "2024-02-05",
//     status: "graded",
//     score: 85,
//     feedback: "Good component structure",
//   },
//   {
//     _id: "5",
//     title: "Week 5 - Advanced React",
//     submittedDate: "2024-02-12",
//     status: "pending",
//   },
// ];

const stackTabs = ["Front-End", "Back-End", "Product Design"];

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
  const [selectedWeek, setSelectedWeek] = useState(1); // Week selector state

  // Calculate current week based on date (for default selection)
  const getCurrentWeek = () => {
    const now = new Date();
    // Assuming program starts at a specific date, calculate week number
    // For now, default to week 1
    return 1;
  };

  // Task submission modal state (for students)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskSubmitModalOpen, setIsTaskSubmitModalOpen] = useState(false);
  const [submissionLink, setSubmissionLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGrading, setIsGrading] = useState(false);

  // Performance review (Review tab) state
  const [performanceRatings, setPerformanceRatings] = useState<
    PerformanceReviewRating[]
  >([]);
  const [currentWeekBreakdown, setCurrentWeekBreakdown] =
    useState<PerformanceReviewRating | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  // Fetch assignments and submissions
  useEffect(() => {
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
  }, [selectedWeek, isAdminViewing, studentStack, studentId, user]);

  // Fetch submissions on initial mount if submissions tab is active
  useEffect(() => {
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
      console.error("Failed to submit assignment:", error);
      toast.error("Failed to submit assignment. Please try again.");
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
      <div className="flex items-center gap-4">
        {isAdminViewing && onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {isAdminViewing ? `Task Board - ${studentName}` : "My Assessments"}
          </h1>
          {isAdminViewing && (
            <p className="text-sm text-muted-foreground">
              Viewing student progress and submissions
            </p>
          )}
        </div>
        {/* Week Selector */}
        <div className="flex items-center gap-2">
          <Label
            htmlFor="week-select"
            className="text-sm font-medium whitespace-nowrap"
          >
            Week:
          </Label>
          <select
            id="week-select"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (
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
                  <p>No assignments found for week {selectedWeek}.</p>
                  <p className="text-sm mt-2">
                    Check back later for new tasks.
                  </p>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => handleTaskClick(task)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50/50 transition-colors gap-3 ${
                      !isAdminViewing && task.status === "pending"
                        ? "cursor-pointer hover:border-[#ffb703]/50"
                        : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium text-foreground">
                          {task.title}
                        </h4>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.charAt(0).toUpperCase() +
                            task.status.slice(1).replace("-", " ")}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {task.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    {task.score && (
                      <div className="text-right">
                        <span className="text-2xl font-bold text-[#34a853]">
                          {task.score}%
                        </span>
                      </div>
                    )}
                  </div>
                ))
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
                        <TableHead>Date</TableHead>
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
                            <TableCell>
                              {rating.title ||
                                rating.assessmentTitle ||
                                `Week ${rating.week} Assessment`}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
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
              <div className="flex items-center justify-between">
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
              <p className="text-sm text-muted-foreground">
                {selectedTask?.description}
              </p>
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
    </div>
  );
}

// Admin Assessment View Component
function AdminAssessmentView() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Front-End");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [students, setStudents] = useState<StudentAssessment[]>(
  //   mockStudentAssessments,
  // );
  const [students, setStudents] = useState<StudentAssessment[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentAssessment | null>(null);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [showUploadTaskDialog, setShowUploadTaskDialog] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assignmentType: "general",
    week: "",
    deadline: "",
    deadlineTime: "23:59",
    allowLateSubmission: false,
  });
  const [gradeData, setGradeData] = useState({
    punctuality: "20",
    attendance: "20",
    classTask: "20",
    assignments: "20",
    personalDefence: "20",
    week: "1",
  });
  const [isUploadingTask, setIsUploadingTask] = useState(false);

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
        week: student.weeklyRating ? 5 : null,
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
  }, [searchQuery, activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchStudents]);

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
    if (isNaN(weekNum) || weekNum < 1) {
      toast.error("Please enter a valid week number");
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
        week: "1",
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
      !taskFormData.description ||
      !taskFormData.deadline ||
      !taskFormData.week
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate week number
    const weekNum = parseInt(taskFormData.week, 10);
    if (isNaN(weekNum) || weekNum < 1) {
      toast.error("Please enter a valid week number");
      return;
    }

    // Map assignment type to stack
    const stackMap: Record<
      string,
      "Front End" | "Back End" | "Product Design"
    > = {
      frontend: "Front End",
      backend: "Back End",
      "product design": "Product Design",
      general: "Front End", // Default to Front End for general
    };

    setIsUploadingTask(true);
    try {
      await createAssignment({
        week: weekNum,
        title: taskFormData.title,
        taskDescription: taskFormData.description,
        stack: stackMap[taskFormData.assignmentType] || "Front End",
        dueDate: taskFormData.deadline,
        dueTime: taskFormData.deadlineTime,
        allowLateSubmissions: taskFormData.allowLateSubmission,
      });

      toast.success(`Task "${taskFormData.title}" uploaded successfully!`);
      setShowUploadTaskDialog(false);
      setTaskFormData({
        title: "",
        description: "",
        assignmentType: "general",
        week: "",
        deadline: "",
        deadlineTime: "23:59",
        allowLateSubmission: false,
      });
    } catch (error) {
      console.error("Failed to upload task:", error);
      toast.error("Failed to upload task. Please try again.");
    } finally {
      setIsUploadingTask(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-foreground">Student Assessment</h1>

      {/* Tabs and Search Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Stack Tabs */}
        <div className="flex flex-wrap gap-2">
          {stackTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-[#ffb703] text-[#08022b]"
                  : "bg-white text-foreground hover:bg-gray-100 border border-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setShowUploadTaskDialog(true)}
          className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500] rounded-full px-6 py-2.5 font-medium flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Upload Task
        </Button>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Students Table */}
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
                    <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                      #
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                      IMAGE
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                      FULL NAME(F/L)
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
                      STACK
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-foreground whitespace-nowrap">
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
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell className="py-3">
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
                      <TableCell className="py-3">
                        <span className="text-sm font-medium">
                          {student.name}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 text-sm text-muted-foreground">
                        {student.stack}
                      </TableCell>
                      <TableCell className="py-3">
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

          <div className="grid grid-cols-2 gap-4">
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
                max="12"
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

          <div className="flex justify-center gap-4 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowGradeDialog(false)}
              className="w-32"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGrade}
              disabled={isSavingGrade}
              className="w-32 bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
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
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload New Task</DialogTitle>
            <DialogDescription>
              Create a new task and assign it to students
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Task Title */}
            <div className="space-y-2">
              <Label htmlFor="taskTitle" className="text-sm font-medium">
                Task Title
              </Label>
              <Input
                id="taskTitle"
                placeholder="Enter task title"
                value={taskFormData.title}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, title: e.target.value })
                }
                className="h-12"
              />
            </div>

            {/* Task Description */}
            <div className="space-y-2">
              <Label htmlFor="taskDescription" className="text-sm font-medium">
                Description
              </Label>
              <textarea
                id="taskDescription"
                placeholder="Enter task description"
                value={taskFormData.description}
                onChange={(e) =>
                  setTaskFormData({
                    ...taskFormData,
                    description: e.target.value,
                  })
                }
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Assignment Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Assign To</Label>
              <div className="flex flex-wrap gap-2">
                {["general", "frontend", "backend", "product design"].map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setTaskFormData({
                          ...taskFormData,
                          assignmentType: type,
                        })
                      }
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                        taskFormData.assignmentType === type
                          ? "bg-[#ffb703] text-[#08022b] border-[#ffb703]"
                          : "bg-white text-foreground border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* Week */}
            <div className="space-y-2">
              <Label htmlFor="week" className="text-sm font-medium">
                Week
              </Label>
              <Input
                id="week"
                type="number"
                min="1"
                max="12"
                placeholder="Enter week number (1-12)"
                value={taskFormData.week}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, week: e.target.value })
                }
                className="h-12"
              />
            </div>

            {/* Deadline Date & Time */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Deadline</Label>
              <div className="flex gap-3">
                <Input
                  id="deadline"
                  type="date"
                  value={taskFormData.deadline}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      deadline: e.target.value,
                    })
                  }
                  className="h-12 flex-1"
                />
                <Input
                  id="deadlineTime"
                  type="time"
                  value={taskFormData.deadlineTime}
                  onChange={(e) =>
                    setTaskFormData({
                      ...taskFormData,
                      deadlineTime: e.target.value,
                    })
                  }
                  className="h-12 w-32"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Deadline must be within the specified week (Sunday 23:59 of the
                week)
              </p>
            </div>

            {/* Allow Late Submissions Toggle */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="space-y-0.5">
                <Label
                  htmlFor="allowLateSubmission"
                  className="text-sm font-medium"
                >
                  Allow Late Submissions
                </Label>
                <p className="text-xs text-muted-foreground">
                  Students can submit after the deadline
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setTaskFormData({
                    ...taskFormData,
                    allowLateSubmission: !taskFormData.allowLateSubmission,
                  })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  taskFormData.allowLateSubmission
                    ? "bg-[#ffb703]"
                    : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    taskFormData.allowLateSubmission
                      ? "translate-x-6"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

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
