"use client";

import { useState } from "react";
import { Trophy, Medal, Award, TrendingUp, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/lib/store/hooks";

// Mock student rankings data
const rankingsData = [
  {
    id: "1",
    rank: 1,
    name: "Amanda Chen",
    avatar: "/placeholder.svg?height=64&width=64&query=student%20amanda",
    stack: "Front-End",
    overallScore: 96,
    tasksCompleted: 45,
    attendance: 98,
    punctuality: 95,
    assignments: 92,
    classTasks: 94,
    personalDefence: 90,
  },
  {
    id: "2",
    rank: 2,
    name: "Marcus Johnson",
    avatar: "/placeholder.svg?height=64&width=64&query=student%20marcus",
    stack: "Back-End",
    overallScore: 94,
    tasksCompleted: 43,
    attendance: 96,
    punctuality: 98,
    assignments: 90,
    classTasks: 92,
    personalDefence: 88,
  },
  {
    id: "3",
    rank: 3,
    name: "Sarah Williams",
    avatar: "/placeholder.svg?height=64&width=64&query=student%20sarah",
    stack: "Product Design",
    overallScore: 92,
    tasksCompleted: 42,
    attendance: 94,
    punctuality: 96,
    assignments: 88,
    classTasks: 90,
    personalDefence: 94,
  },
  {
    id: "4",
    rank: 4,
    name: "David Brown",
    avatar: "/placeholder.svg?height=64&width=64&query=student%20david",
    stack: "Front-End",
    overallScore: 90,
    tasksCompleted: 40,
    attendance: 92,
    punctuality: 94,
    assignments: 86,
    classTasks: 88,
    personalDefence: 92,
  },
  {
    id: "5",
    rank: 5,
    name: "Emily Davis",
    avatar: "/placeholder.svg?height=64&width=64&query=student%20emily",
    stack: "Back-End",
    overallScore: 88,
    tasksCompleted: 38,
    attendance: 90,
    punctuality: 92,
    assignments: 84,
    classTasks: 86,
    personalDefence: 90,
  },
  {
    id: "6",
    rank: 6,
    name: "James Wilson",
    avatar: "/placeholder.svg?height=64&width=64&query=student%20james",
    stack: "Product Design",
    overallScore: 86,
    tasksCompleted: 37,
    attendance: 88,
    punctuality: 90,
    assignments: 82,
    classTasks: 84,
    personalDefence: 88,
  },
  {
    id: "7",
    rank: 7,
    name: "Lisa Anderson",
    avatar: "/placeholder.svg?height=64&width=64&query=student%20lisa",
    stack: "Front-End",
    overallScore: 84,
    tasksCompleted: 35,
    attendance: 86,
    punctuality: 88,
    assignments: 80,
    classTasks: 82,
    personalDefence: 86,
  },
  {
    id: "8",
    rank: 8,
    name: "Michael Taylor",
    avatar: "/placeholder.svg?height=64&width=64&query=student%20michael",
    stack: "Back-End",
    overallScore: 82,
    tasksCompleted: 34,
    attendance: 84,
    punctuality: 86,
    assignments: 78,
    classTasks: 80,
    personalDefence: 84,
  },
];

// Task-specific rankings
const taskRankings = [
  { name: "HTML Basics", topScorer: "Amanda Chen", score: 100 },
  { name: "CSS Fundamentals", topScorer: "Marcus Johnson", score: 98 },
  { name: "JavaScript Intro", topScorer: "Sarah Williams", score: 96 },
  { name: "DOM Manipulation", topScorer: "David Brown", score: 95 },
  { name: "React Basics", topScorer: "Amanda Chen", score: 98 },
  { name: "API Integration", topScorer: "Marcus Johnson", score: 97 },
  { name: "Database Design", topScorer: "Emily Davis", score: 94 },
  { name: "UI/UX Principles", topScorer: "Sarah Williams", score: 99 },
];

const tabs = ["All", "Front-End", "Back-End", "Product Design"];

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-[#ffb703]" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-700" />;
    default:
      return (
        <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
      );
  }
};

const getStackColor = (stack: string) => {
  switch (stack) {
    case "Front-End":
      return "bg-blue-100 text-blue-800";
    case "Back-End":
      return "bg-green-100 text-green-800";
    case "Product Design":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function RankingsPage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState("All");

  const filteredRankings =
    activeTab === "All"
      ? rankingsData
      : rankingsData.filter((student) => student.stack === activeTab);

  return (
    <DashboardLayout title="Rankings">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#1a365d]">
            Student Rankings
          </h1>
          <p className="mt-1 text-muted-foreground">
            View top performers across all tasks and overall standings
          </p>
        </div>

        {/* Top 3 Podium */}
        {/* <div className="grid gap-4 md:grid-cols-3">
          {rankingsData.slice(0, 3).map((student, index) => {
            const positions = [
              { medal: "🥇", color: "#ffb703", height: "h-full" },
              { medal: "🥈", color: "#9ca3af", height: "h-[90%]" },
              { medal: "🥉", color: "#b45309", height: "h-[80%]" },
            ];
            const pos = positions[index];

            return (
              <Card
                key={student.id}
                className="border-none shadow-md transition-shadow hover:shadow-lg overflow-hidden"
              >
                <div className="h-2" style={{ backgroundColor: pos.color }} />
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <span className="text-4xl mb-2">{pos.medal}</span>
                    <Avatar className="h-20 w-20 ring-4 ring-[#ffb703]/20">
                      <AvatarImage src={student.avatar} alt={student.name} />
                      <AvatarFallback className="bg-[#ffb703] text-xl text-[#08022b]">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="mt-4 text-lg font-bold text-foreground">
                      {student.name}
                    </h3>
                    <Badge className={`mt-1 ${getStackColor(student.stack)}`}>
                      {student.stack}
                    </Badge>
                    <div className="mt-4 text-center">
                      <p
                        className="text-3xl font-bold"
                        style={{ color: pos.color }}
                      >
                        {student.overallScore}%
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Overall Score
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div> */}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all border ${
                activeTab === tab
                  ? "bg-[#ffb703] text-[#08022b] border-[#ffb703]"
                  : "bg-white text-foreground border-gray-200 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Full Rankings Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#ffb703]" />
              Overall Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#ffb703]/10 hover:bg-[#ffb703]/10">
                    <TableHead className="w-[80px] text-xs font-semibold">
                      Rank
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Student
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Stack
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Overall
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Attendance
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Punctuality
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Assignments
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Tasks
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRankings.map((student) => (
                    <TableRow
                      key={student.id}
                      className="hover:bg-gray-50/50 border-b border-gray-50"
                    >
                      <TableCell className="py-4">
                        <div className="flex items-center justify-center">
                          {getRankIcon(student.rank)}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={student.avatar}
                              alt={student.name}
                            />
                            <AvatarFallback className="bg-[#ffb703] text-xs text-[#08022b]">
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">
                            {student.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          className={`${getStackColor(student.stack)} text-xs`}
                        >
                          {student.stack}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <span className="font-bold text-[#34a853]">
                          {student.overallScore}%
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm">
                        {student.attendance}%
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm">
                        {student.punctuality}%
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm">
                        {student.assignments}%
                      </TableCell>
                      <TableCell className="py-4 text-right text-sm">
                        {student.classTasks}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Task-Specific Rankings */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-[#ffb703]" />
              Top Performers by Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {taskRankings.map((task, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {task.name}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {task.topScorer}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-[#ffb703]" />
                    <span className="text-sm font-bold text-[#34a853]">
                      {task.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
