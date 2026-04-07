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

// Types
interface StudentAssessment {
  id: string;
  name: string;
  avatar?: string;
  stack: string;
  week: number | null;
  hasCheck: boolean;
  avgPercent: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "completed" | "pending" | "in-progress";
  score?: number;
}

interface Submission {
  id: string;
  title: string;
  submittedDate: string;
  status: "graded" | "pending" | "late";
  score?: number;
  feedback?: string;
}

// Mock data for admin view - each student has unique ID
const mockStudentAssessments: StudentAssessment[] = [
  {
    id: "student-1",
    name: "Emma Johnson",
    stack: "Frontend Development",
    week: 5,
    hasCheck: true,
    avgPercent: "76%",
  },
  {
    id: "student-2",
    name: "Michael Chen",
    stack: "Frontend Development",
    week: 5,
    hasCheck: true,
    avgPercent: "82%",
  },
  {
    id: "student-3",
    name: "Sarah Williams",
    stack: "Frontend Development",
    week: null,
    hasCheck: false,
    avgPercent: null,
  },
  {
    id: "student-4",
    name: "David Brown",
    stack: "Frontend Development",
    week: 5,
    hasCheck: true,
    avgPercent: "79%",
  },
  {
    id: "student-5",
    name: "Lisa Anderson",
    stack: "Frontend Development",
    week: null,
    hasCheck: false,
    avgPercent: null,
  },
  {
    id: "student-6",
    name: "James Taylor",
    stack: "Frontend Development",
    week: 5,
    hasCheck: true,
    avgPercent: "88%",
  },
  {
    id: "student-7",
    name: "Jennifer Martinez",
    stack: "Frontend Development",
    week: 5,
    hasCheck: true,
    avgPercent: "71%",
  },
  {
    id: "student-8",
    name: "Robert Garcia",
    stack: "Frontend Development",
    week: 5,
    hasCheck: true,
    avgPercent: "85%",
  },
  {
    id: "student-9",
    name: "Emily Davis",
    stack: "Frontend Development",
    week: 5,
    hasCheck: true,
    avgPercent: "92%",
  },
  {
    id: "student-10",
    name: "Daniel Wilson",
    stack: "Frontend Development",
    week: 5,
    hasCheck: true,
    avgPercent: "78%",
  },
  {
    id: "student-11",
    name: "Amanda Thomas",
    stack: "Frontend Development",
    week: null,
    hasCheck: false,
    avgPercent: null,
  },
];

// Mock tasks data
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Build a Responsive Landing Page",
    description:
      "Create a fully responsive landing page using HTML, CSS, and JavaScript",
    dueDate: "2024-02-20",
    status: "completed",
    score: 85,
  },
  {
    id: "2",
    title: "React Component Library",
    description: "Build reusable components with proper documentation",
    dueDate: "2024-02-25",
    status: "completed",
    score: 90,
  },
  {
    id: "3",
    title: "API Integration Project",
    description: "Integrate a REST API into a React application",
    dueDate: "2024-03-01",
    status: "in-progress",
  },
  {
    id: "4",
    title: "State Management Implementation",
    description: "Implement Redux or Zustand in an existing project",
    dueDate: "2024-03-05",
    status: "pending",
  },
  {
    id: "5",
    title: "Testing with Jest",
    description: "Write unit tests for existing components",
    dueDate: "2024-03-10",
    status: "pending",
  },
];

// Mock submissions data
const mockSubmissions: Submission[] = [
  {
    id: "1",
    title: "Week 1 - HTML Basics",
    submittedDate: "2024-01-15",
    status: "graded",
    score: 88,
    feedback: "Great work on semantic HTML!",
  },
  {
    id: "2",
    title: "Week 2 - CSS Layouts",
    submittedDate: "2024-01-22",
    status: "graded",
    score: 92,
    feedback: "Excellent use of flexbox and grid",
  },
  {
    id: "3",
    title: "Week 3 - JavaScript Fundamentals",
    submittedDate: "2024-01-29",
    status: "graded",
    score: 78,
    feedback: "Good but needs work on async/await",
  },
  {
    id: "4",
    title: "Week 4 - React Basics",
    submittedDate: "2024-02-05",
    status: "graded",
    score: 85,
    feedback: "Good component structure",
  },
  {
    id: "5",
    title: "Week 5 - Advanced React",
    submittedDate: "2024-02-12",
    status: "pending",
  },
];

const stackTabs = ["Front-End", "Back-End", "Product Design"];

// Student Assessment View Component - with Tasks, Review, Submissions tabs
function StudentAssessmentView({
  studentName,
  studentId,
  isAdminViewing = false,
  onBack,
}: {
  studentName?: string;
  studentId?: string;
  isAdminViewing?: boolean;
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("tasks");
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [scoreInput, setScoreInput] = useState("");

  const handleSubmissionClick = (submission: Submission) => {
    if (!isAdminViewing) return;
    setSelectedSubmission(submission);
    setScoreInput(submission.score?.toString() || "");
    setIsScoreModalOpen(true);
  };

  const handleSaveScore = () => {
    const score = parseInt(scoreInput, 10);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error("Please enter a valid score between 0 and 100");
      return;
    }
    // Update the submission score in mockSubmissions
    const submissionIndex = mockSubmissions.findIndex(
      (s) => s.id === selectedSubmission?.id,
    );
    if (submissionIndex !== -1) {
      mockSubmissions[submissionIndex].score = score;
      mockSubmissions[submissionIndex].status = "graded";
    }
    toast.success(`Score saved for ${selectedSubmission?.title}`);
    setIsScoreModalOpen(false);
    setSelectedSubmission(null);
    setScoreInput("");
  };

  const handleCloseModal = () => {
    setIsScoreModalOpen(false);
    setSelectedSubmission(null);
    setScoreInput("");
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAdminViewing ? `Task Board - ${studentName}` : "My Assessments"}
          </h1>
          {isAdminViewing && (
            <p className="text-sm text-muted-foreground">
              Viewing student progress and submissions
            </p>
          )}
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
                  Frontend Development
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
              {mockTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-gray-50/50 transition-colors gap-3"
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
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="mt-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Performance Review</CardTitle>
              <CardDescription>
                Your weekly assessments and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                    <TableRow>
                      <TableCell className="font-medium">Week 5</TableCell>
                      <TableCell>Advanced React Patterns</TableCell>
                      <TableCell className="text-muted-foreground">
                        Feb 15, 2024
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[#34a853]">
                          85%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[#34a853]/10 text-[#34a853]">
                          Graded
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Week 4</TableCell>
                      <TableCell>React Hooks Deep Dive</TableCell>
                      <TableCell className="text-muted-foreground">
                        Feb 8, 2024
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[#34a853]">
                          78%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[#34a853]/10 text-[#34a853]">
                          Graded
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Week 3</TableCell>
                      <TableCell>Component Architecture</TableCell>
                      <TableCell className="text-muted-foreground">
                        Feb 1, 2024
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-[#34a853]">
                          92%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[#34a853]/10 text-[#34a853]">
                          Graded
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Week 6</TableCell>
                      <TableCell>State Management</TableCell>
                      <TableCell className="text-muted-foreground">
                        Feb 22, 2024
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        <Badge className="bg-[#ffb703]/10 text-[#ffb703]">
                          Pending
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Grade Breakdown */}
              <div className="mt-8">
                <h4 className="font-semibold mb-4">
                  Current Week Grade Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Punctuality</p>
                    <p className="text-lg font-semibold text-[#34a853]">
                      18/20
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Attendance</p>
                    <p className="text-lg font-semibold text-[#34a853]">
                      20/20
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Class Task</p>
                    <p className="text-lg font-semibold text-[#34a853]">
                      17/20
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Assignments</p>
                    <p className="text-lg font-semibold text-[#34a853]">
                      15/20
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Defence</p>
                    <p className="text-lg font-semibold text-[#34a853]">
                      15/20
                    </p>
                  </div>
                  <div className="p-3 bg-[#ffb703]/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold text-[#ffb703]">85%</p>
                  </div>
                </div>
              </div>
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
              {mockSubmissions.map((submission) => (
                <div
                  key={submission.id}
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
                      {new Date(submission.submittedDate).toLocaleDateString()}
                    </p>
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
              ))}
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
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveScore}
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              Save Score
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
  const [students, setStudents] = useState<StudentAssessment[]>(
    mockStudentAssessments,
  );
  const [selectedStudent, setSelectedStudent] =
    useState<StudentAssessment | null>(null);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [showUploadTaskDialog, setShowUploadTaskDialog] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assignmentType: "general",
    deadline: "",
  });
  const [gradeData, setGradeData] = useState({
    punctuality: "20",
    attendance: "20",
    classTask: "20",
    assignments: "20",
    personalDefence: "20",
  });

  // Search students
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: "students",
        stack: activeTab,
      });

      const response = await fetch(`/api/students/search?${params}`);
      const result = await response.json();

      // Map to assessment format
      const mapped = result.data.map(
        (s: { id: string; name: string }, index: number) => ({
          id: s.id,
          name: s.name,
          stack:
            activeTab === "Front-End"
              ? "Frontend Development"
              : activeTab === "Back-End"
                ? "Backend Development"
                : "Product Design",
          week: Math.random() > 0.3 ? 5 : null,
          hasCheck: Math.random() > 0.3,
          avgPercent: Math.random() > 0.3 ? "76%" : null,
          avatar: `/placeholder.svg?height=40&width=40&query=student%20${index + 1}`,
        }),
      );

      setStudents(mapped.length > 0 ? mapped : mockStudentAssessments);
    } catch (error) {
      console.error("Search failed:", error);
      // Fallback to local filter
      const filtered = mockStudentAssessments.filter((s) =>
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
    // Navigate to task board page with student info
    router.push(
      `/assessments?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}`,
    );
  };

  const handleReviewAttendance = (student: StudentAssessment) => {
    // Navigate to checkin page with student ID as query param
    router.push(
      `/checkin?studentId=${student.id}&studentName=${encodeURIComponent(student.name)}`,
    );
  };

  const handleSaveGrade = () => {
    toast.success("Grade saved successfully!");
    setShowGradeDialog(false);
    setSelectedStudent(null);
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
                      key={`${student.id}-${index}`}
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
                                router.push(`/students/${student.id}`)
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
              Student grading week 5
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
              className="w-32 bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              Save Grade
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

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium">
                Deadline
              </Label>
              <Input
                id="deadline"
                type="date"
                value={taskFormData.deadline}
                onChange={(e) =>
                  setTaskFormData({ ...taskFormData, deadline: e.target.value })
                }
                className="h-12"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowUploadTaskDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!taskFormData.title || !taskFormData.deadline) {
                  toast.error("Please fill in all required fields");
                  return;
                }
                toast.success(
                  `Task "${taskFormData.title}" uploaded successfully!`,
                );
                setShowUploadTaskDialog(false);
                setTaskFormData({
                  title: "",
                  description: "",
                  assignmentType: "general",
                  deadline: "",
                });
              }}
              className="bg-[#ffb703] text-[#08022b] hover:bg-[#fb8500]"
            >
              Upload Task
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

  // If admin is viewing a specific student's task board
  if (isAdmin && studentId && studentName) {
    return (
      <DashboardLayout title="Task Board">
        <StudentAssessmentView
          studentName={decodeURIComponent(studentName)}
          studentId={studentId}
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
