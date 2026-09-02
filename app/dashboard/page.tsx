"use client";

import { useState, useEffect } from "react";
import { Users, GraduationCap, Leaf } from "lucide-react";
import axiosInstance from "@/lib/api/axios";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/lib/store/hooks";
import { useProgramSettings } from "@/components/providers/program-settings-provider";
import Link from "next/link";

// Students of the week data
const studentsOfWeek = [
  {
    id: "1",
    name: " ",
    role: "Front-End Trainee",
    avatar:
      "/placeholder.svg?height=200&width=200&query=african%20woman%20professional",
    bgColor: "bg-[#dbeafe]",
    cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
  },
  {
    id: "2",
    name: " ",
    role: "Back-End Trainee",
    avatar:
      "/placeholder.svg?height=200&width=200&query=african%20man%20science%20shirt",
    bgColor: "bg-[#f5e6d3]",
    cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
  },
  {
    id: "3",
    name: " ",
    role: "Product Design Trainee",
    avatar:
      "/placeholder.svg?height=200&width=200&query=african%20man%20casual",
    bgColor: "bg-[#fef9c3]",
    cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
  },
];

// Stats config (icons and colors)
const statsConfig = [
  {
    label: "Students",
    key: "students",
    icon: GraduationCap,
    iconColor: "text-[#ffb703]",
    iconBg: "bg-[#ffb703]/10",
  },
  {
    label: "Staff",
    key: "staffs",
    icon: Users,
    iconColor: "text-[#219ebc]",
    iconBg: "bg-[#219ebc]/10",
  },
  {
    label: "Alumni",
    key: "alumnis",
    icon: Leaf,
    iconColor: "text-[#34a853]",
    iconBg: "bg-[#34a853]/10",
  },
];

const tabs = ["Front-End", "Back-End", "Product Design"];

interface HistoryItem {
  week: number;
  name: string;
  overallRating: string;
  weeklyRating: string;
}

export default function DashboardPage() {
  const user = useCurrentUser();
  const { currentWeek } = useProgramSettings();
  const [activeTab, setActiveTab] = useState("Front-End");
  const [studentsOfWeekData, setStudentsOfWeekData] = useState<
    typeof studentsOfWeek
  >([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState({
    students: 0,
    staffs: 0,
    alumnis: 0,
  });
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyCache, setHistoryCache] = useState<
    Record<string, HistoryItem[]>
  >({});

  // const getDashboardTitle = () => {
  //   return `Hi ${user?.fullName || ""}`;
  // };

  const getStudentoftheWeekInfo = async () => {
    try {
      setLoading(true);
      const [frontendRes, backendRes, productRes] = await Promise.all([
        axiosInstance.get("/SOW/student"),
        axiosInstance.get("/BSOW/student"),
        axiosInstance.get("/PSOW/student"),
      ]);

      const fetchedData = [
        {
          id: frontendRes.data?.data?.student?._id || "1",
          name: frontendRes.data?.data?.student?.name || " ",
          role: "Front-End Trainee",
          avatar:
            frontendRes.data?.data?.student?.image ||
            "/placeholder.svg?height=200&width=200&query=african%20woman%20professional",
          bgColor: "bg-[#dbeafe]",
          cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
        },
        {
          id: backendRes.data?.data?.student?._id || "2",
          name: backendRes.data?.data?.student?.name || " ",
          role: "Back-End Trainee",
          avatar:
            backendRes.data?.data?.student?.image ||
            "/placeholder.svg?height=200&width=200&query=african%20man%20science%20shirt",
          bgColor: "bg-[#f5e6d3]",
          cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
        },
        {
          id: productRes.data?.data?.student?._id || "3",
          name: productRes.data?.data?.student?.name || " ",
          role: "Product Design Trainee",
          avatar:
            productRes.data?.data?.student?.image ||
            "/placeholder.svg?height=200&width=200&query=african%20man%20casual",
          bgColor: "bg-[#fef9c3]",
          cardShadow: "shadow-[0_10px_30px_rgba(0,0,0,0.17)]",
        },
      ];

      setStudentsOfWeekData(fetchedData);
    } catch (error) {
      console.error("Error fetching students of the week:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getStudentoftheWeekInfo();
    getDashboardStats();
  }, []);

  useEffect(() => {
    fetchHistoryData(activeTab);
  }, [activeTab]);

  const fetchHistoryData = async (tab: string) => {
    if (historyCache[tab]) {
      setHistoryData(historyCache[tab]);
      return;
    }

    try {
      setHistoryLoading(true);
      let endpoint = "";
      switch (tab) {
        case "Front-End":
          endpoint = "/SOW/all";
          break;
        case "Back-End":
          endpoint = "/BSOW/all";
          break;
        case "Product Design":
          endpoint = "/PSOW/all";
          break;
        default:
          endpoint = "/SOW/all";
      }

      const response = await axiosInstance.get(endpoint);
      const data = response.data?.data || [];

      const formattedData = data.map((item: any) => ({
        week: item.week || item._id || 0,
        name: item.student?.name || "Unknown",
        overallRating: item.student?.overallRating || "0%",
        weeklyRating: item.student?.weeklyRating || "0%",
      }));

      setHistoryCache((prev) => ({ ...prev, [tab]: formattedData }));
      setHistoryData(formattedData);
    } catch (error) {
      console.error("Error fetching history data:", error);
      setHistoryData([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const getDashboardStats = async () => {
    try {
      const response = await axiosInstance.get("/users/dashboard/stats");
      const data = response.data?.data || response.data || {};
      console.log("Dashboard stats response:", data);
      setStatsData({
        students: data.students || 0,
        staffs: data.staffs || 0,
        alumnis: data.alumnis || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Hi {user?.fullName || ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {`It's week ${currentWeek} at The Curve Africa`}
          </p>
        </div>

        {/* Students Of The Week */}
        <div className="">
          <h2 className="mb-4 text-center text-xl font-semibold text-foreground md:text-left">
            Students Of The Week
          </h2>

          {/* Mobile: Single column, Desktop: Row with stats on right */}
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Student Cards */}
            <div className="flex flex-col gap-6 md:flex-row md:flex-wrap md:gap-10 lg:flex-1">
              {loading ? (
                // Loading skeletons
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1">
                      <Card className="border-none bg-gray-100 rounded-2xl">
                        <CardContent className="flex flex-col items-center p-5">
                          <Skeleton className="h-24 w-24 rounded-full md:h-28 md:w-28 bg-neutral-200" />
                          <Skeleton className="mt-3 h-5 w-32 bg-neutral-200" />
                          <Skeleton className="mt-1 h-4 w-24 bg-neutral-200" />
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </>
              ) : (
                studentsOfWeekData.map((student, index) => (
                  <Link
                    key={`${student.id}-${index}`}
                    href={`/students/${student.id}`}
                    className="group flex-1"
                  >
                    <Card
                      className={`border-none ${student.bgColor} ${student.cardShadow} transition-shadow hover:shadow-lg rounded-2xl`}
                    >
                      <CardContent className="flex flex-col items-center p-5">
                        <div className="rounded-full p-0 bg-white/50">
                          <Avatar className="h-24 w-24 ring-0 md:h-28 md:w-28">
                            <AvatarImage
                              src={student.avatar}
                              alt={student.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-[#ffb703] text-xl text-[#08022b]">
                              {student.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <h3 className="mt-3 text-center font-semibold text-[#333333] text-sm md:text-base">
                          {student.name}
                        </h3>
                        <p className="text-xs text-[#687182]">
                          {student.role}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>

            {/* Stats Cards - Stack on mobile, vertical on desktop */}
            <div className="flex flex-col gap-4 lg:w-[180px]">
              {loading ? (
                // Loading skeletons for stats
                <>
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-none bg-card shadow-sm">
                      <CardContent className="flex items-center justify-center gap-4 p-4 md:justify-start">
                        <Skeleton className="h-10 w-10 rounded-lg bg-neutral-200" />
                        <div className="text-center md:text-left">
                          <Skeleton className="h-7 w-12 bg-neutral-200" />
                          <Skeleton className="mt-1 h-4 w-16 bg-neutral-200" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                statsConfig.map((stat) => (
                  <Card
                    key={stat.label}
                    className="border-none bg-card shadow-sm"
                  >
                    <CardContent className="flex items-center justify-center gap-4 p-4 md:justify-start">
                      <div className={`rounded-lg p-2 ${stat.iconBg}`}>
                        <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                      </div>
                      <div className="text-center md:text-left">
                        <p className="text-2xl font-bold text-foreground">
                          {statsData[stat.key as keyof typeof statsData]}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stat.label}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            History
          </h2>

          {/* Tabs - Pill shaped buttons */}
          <div className="mb-6 flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all border ${
                  activeTab === tab
                    ? "bg-[#ffb703] text-[#08022b] border-[#ffb703]"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Table - Responsive for mobile */}
          <Card className="border-none bg-card shadow-sm overflow-hidden">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="w-[50px] text-xs text-muted-foreground">
                      Week
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Name
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground">
                      Average Rating
                    </TableHead>
                    <TableHead className="text-right text-xs text-muted-foreground">
                      Current Rating
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index} className="border-b border-gray-50">
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-8 bg-neutral-200" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-32 bg-neutral-200" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-12 bg-neutral-200" />
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <Skeleton className="h-4 w-12 bg-neutral-200 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : historyData.length > 0 ? (
                    historyData.map((row, index) => (
                      <TableRow
                        key={index}
                        className="border-b border-gray-50 hover:bg-gray-50/50"
                      >
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {row.week}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-sm font-medium">{row.name}</div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-sm font-medium text-[#ffb703]">
                            {Number(row.overallRating).toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-right">
                          <span className="text-sm font-medium text-[#34a853]">
                            {row.weeklyRating}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No history data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
