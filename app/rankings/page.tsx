"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal, Award, TrendingUp, Users, Loader2 } from "lucide-react";
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
import axiosInstance from "@/lib/api/axios";

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

interface TopScorerItem {
  title: string;
  name: string;
  totalScore: number;
}

interface RankingsResponse {
  rankings: ApiRankingItem[];
  topAssignmentScorers: TopScorerItem[];
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
  const [activeTab, setActiveTab] = useState("All");
  const [rankingsData, setRankingsData] = useState<RankingRow[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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
        setTopScorers(response.data.topAssignmentScorers || []);
      } catch (error) {
        console.error("Failed to fetch rankings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRankings();
  }, [activeTab]);

  const filteredRankings = rankingsData;

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
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#ffb703]" />
                </div>
              ) : (
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
                    {filteredRankings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                          No rankings data available
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRankings.map((student) => (
                        <TableRow
                          key={student.rank}
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
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
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
              {topScorers.map((scorer, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {scorer.title}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {scorer.name}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-[#ffb703]" />
                    <span className="text-sm font-bold text-[#34a853]">
                      {scorer.totalScore}%
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
