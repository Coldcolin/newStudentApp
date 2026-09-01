"use client";

import { useState, useEffect, useMemo } from "react";
import { Trophy, Medal, Award, TrendingUp, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/lib/store/hooks";
import axiosInstance, { type ApiError } from "@/lib/api/axios";
import {
  type TopPerformer,
  getTopPerformersByWeek,
  toDisplayScore,
} from "@/lib/api/assignments";
import { buildWeekOptions } from "@/lib/api/settings";
import { useProgramSettings } from "@/components/providers/program-settings-provider";

interface ApiRankingItem {
  studentName: string;
  stack: string;
  overallScore: number;
  punctuality: number;
  Assignments: number;
  personalDefence: number;
  classParticipation: number;
  classAssessment: number;
}

interface RankingsResponse {
  rankings: ApiRankingItem[];
}

interface RankingRow {
  rank: number;
  name: string;
  stack: string;
  overallScore: number;
  punctuality: number;
  assignments: number;
  personalDefence: number;
  classParticipation: number;
  classAssessment: number;
}



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
  const s = stack.toLowerCase().replace(/[-\s]/g, "");
  if (s === "frontend") return "bg-blue-100 text-blue-800";
  if (s === "backend") return "bg-green-100 text-green-800";
  if (s === "productdesign") return "bg-purple-100 text-purple-800";
  return "bg-gray-100 text-gray-800";
};

const normalizeStack = (stack: string) =>
  stack.toLowerCase().replace(/[-\s]/g, "");

const tabs = ["All", "Front-End", "Back-End", "Product Design"];

export default function RankingsPage() {
  const user = useCurrentUser();
  const { currentWeek, totalWeeks, isLoaded } = useProgramSettings();
  const [activeTab, setActiveTab] = useState("All");
  const [rankingsData, setRankingsData] = useState<RankingRow[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTopPerformers, setIsLoadingTopPerformers] = useState(false);

  const weekOptions = useMemo(() => buildWeekOptions(totalWeeks), [totalWeeks]);

  // Seed the week only once settings have settled — seeding earlier latches onto
  // the placeholder week 1 and never moves to the configured week.
  useEffect(() => {
    if (!isLoaded) return;
    setSelectedWeek((week) => week ?? currentWeek);
  }, [isLoaded, currentWeek]);

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true);
      try {
        const params = activeTab === "All" ? undefined : { stack: normalizeStack(activeTab) };
        const response = await axiosInstance.get<RankingsResponse>("/users/rankings", { params });
        const items = response.data.rankings || [];
        const sorted = [...items].sort((a, b) => b.overallScore - a.overallScore);
        setRankingsData(
          sorted.map((item, index) => ({
            rank: index + 1,
            name: item.studentName,
            stack: item.stack,
            overallScore: item.overallScore,
            punctuality: item.punctuality,
            assignments: item.Assignments,
            personalDefence: item.personalDefence,
            classParticipation: item.classParticipation,
            classAssessment: item.classAssessment,
          }))
        );
      } catch (error) {
        const apiError = error as ApiError;
        console.error("Failed to fetch rankings:", error);
        toast.error(apiError.message || "Failed to load rankings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchRankings();
  }, [activeTab]);

  useEffect(() => {
    if (selectedWeek === null) return;
    const fetchTopPerformers = async () => {
      setIsLoadingTopPerformers(true);
      try {
        const stack = activeTab === "All" ? undefined : normalizeStack(activeTab);
        const data = await getTopPerformersByWeek(selectedWeek, stack);
        setTopPerformers(data.topPerformers || []);
      } catch (error) {
        const apiError = error as ApiError;
        console.error("Failed to fetch top performers:", error);
        toast.error(apiError.message || "Failed to load top performers");
        setTopPerformers([]);
      } finally {
        setIsLoadingTopPerformers(false);
      }
    };
    fetchTopPerformers();
  }, [selectedWeek, activeTab]);

  const filteredRankings = rankingsData;

  return (
    <DashboardLayout title="Rankings">
      <div className="min-w-0 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
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
                key={student._id}
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-4 flex flex-nowrap gap-3 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-full px-6 py-2.5 text-sm font-medium transition-all border ${
                  activeTab === tab
                    ? "bg-[#ffb703] text-[#08022b] border-[#ffb703]"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Week Selector — scopes the Top Performers card below */}
          <div className="flex w-full items-center gap-2 lg:w-auto">
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
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 lg:w-auto"
            >
              {weekOptions.map((week) => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
              </div>
            ) : filteredRankings.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No rankings data available
              </p>
            ) : (
              <>
                <div className="space-y-3 px-4 pb-4 md:hidden">
                  {filteredRankings.map((student) => (
                    <div
                      key={student.rank}
                      className="mx-auto w-full max-w-[310px] rounded-lg border border-border bg-muted/40 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                          {getRankIcon(student.rank)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarImage src="/placeholder.svg" alt={student.name} />
                              <AvatarFallback className="bg-[#ffb703] text-xs text-[#08022b]">
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {student.name}
                              </p>
                              <Badge
                                className={`mt-1 ${getStackColor(student.stack)} text-xs`}
                              >
                                {student.stack}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-bold text-[#34a853]">
                            {student.overallScore.toFixed(2)}%
                          </p>
                          <p className="text-xs text-muted-foreground">Overall</p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Punctuality</p>
                          <p className="text-sm font-medium">
                            {student.punctuality.toFixed(2)}%
                          </p>
                        </div>
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Assignments</p>
                          <p className="text-sm font-medium">
                            {student.assignments.toFixed(2)}%
                          </p>
                        </div>
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Participation</p>
                          <p className="text-sm font-medium">
                            {student.classParticipation.toFixed(2)}%
                          </p>
                        </div>
                        <div className="rounded-md bg-background/70 px-3 py-2">
                          <p className="text-xs text-muted-foreground">Assessment</p>
                          <p className="text-sm font-medium">
                            {student.classAssessment.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden px-2 md:block">
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
                          Punctuality
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right">
                          Assignments
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right">
                          Participation
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-right">
                          Assessment
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRankings.map((student) => (
                        <TableRow
                          key={student.rank}
                          className="hover:bg-muted/50 border-b border-border"
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center">
                              {getRankIcon(student.rank)}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src="/placeholder.svg" alt={student.name} />
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
                              {student.overallScore.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right text-sm">
                            {student.punctuality.toFixed(2)}%
                          </TableCell>
                          <TableCell className="py-4 text-right text-sm">
                            {student.assignments.toFixed(2)}%
                          </TableCell>
                          <TableCell className="py-4 text-right text-sm">
                            {student.classParticipation.toFixed(2)}%
                          </TableCell>
                          <TableCell className="py-4 text-right text-sm">
                            {student.classAssessment.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Task-Specific Rankings */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-[#ffb703]" />
              Top Performers by Task
              {selectedWeek !== null && (
                <span className="font-normal text-muted-foreground">
                  — Week {selectedWeek}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTopPerformers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
              </div>
            ) : topPerformers.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No tasks for this week
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {topPerformers.map((performer) => (
                  <div
                    key={performer.assignmentId}
                    className="p-4 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors"
                  >
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {performer.title}
                    </p>
                    {performer.student ? (
                      <>
                        <div className="mt-2 flex items-center gap-2">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage
                              src={performer.student.image || "/placeholder.svg"}
                              alt={performer.student.name}
                            />
                            <AvatarFallback className="bg-[#ffb703] text-xs text-[#08022b]">
                              {performer.student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <p className="min-w-0 truncate font-semibold text-foreground">
                            {performer.student.name}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-[#ffb703]" />
                          <span className="text-sm font-bold text-[#34a853]">
                            {toDisplayScore(performer.grade)}%
                          </span>
                          {performer.tiedCount > 1 && (
                            <span className="ml-1 text-xs text-muted-foreground">
                              tied with {performer.tiedCount - 1} other
                              {performer.tiedCount > 2 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Not yet graded
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
