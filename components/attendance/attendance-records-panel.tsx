"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProgramSettings } from "@/components/providers/program-settings-provider";
import { StudentAttendanceCard } from "./student-attendance-card";
import { buildWeekOptions } from "@/lib/api/settings";
import { normalizeStack } from "@/lib/utils";
import type { ApiError } from "@/lib/api/axios";
import {
  getAttendanceOverview,
  getStudentAttendance,
  punctualityPercent,
  type AttendanceOverviewStudent,
  type AttendanceRecord,
} from "@/lib/api/attendance";

const STACKS = ["Front-End", "Back-End", "Product Design"];

/** "All time" is the default; the rest are program weeks. */
const ALL_TIME = "all";

/**
 * Every student's attendance in one table, for tutors.
 *
 * The summary row comes from one request; a student's individual check-ins are
 * fetched only when their row is opened, and cached per week — so a tutor
 * scanning the cohort pays for one request, not one per student.
 *
 * Search and the stack filter run client-side over the loaded roster (instant,
 * no round trip per keystroke). The week filter is server-side, because it
 * changes what the totals are counted over.
 */
export function AttendanceRecordsPanel() {
  const { currentWeek, totalWeeks, isLoaded } = useProgramSettings();

  const [students, setStudents] = useState<AttendanceOverviewStudent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStack, setActiveStack] = useState<string | null>(null);
  const [week, setWeek] = useState<string>(ALL_TIME);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Keyed by `${studentId}:${week}` so switching weeks refetches rather than
  // showing the previous week's records under the new heading.
  const [recordsCache, setRecordsCache] = useState<
    Record<string, AttendanceRecord[]>
  >({});
  const [loadingRecordsFor, setLoadingRecordsFor] = useState<string | null>(
    null,
  );

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAttendanceOverview(
        week === ALL_TIME ? undefined : { week: Number(week) },
      );
      setStudents(data.students ?? []);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to load attendance overview:", error);
      toast.error(apiError.message || "Couldn't load attendance records");
    } finally {
      setIsLoading(false);
    }
  }, [week]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Changing the week invalidates every open row: the records under it belong
  // to the old window.
  useEffect(() => {
    setExpandedId(null);
  }, [week]);

  const toggleRow = async (student: AttendanceOverviewStudent) => {
    if (expandedId === student._id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(student._id);

    const cacheKey = `${student._id}:${week}`;
    if (recordsCache[cacheKey]) return;

    setLoadingRecordsFor(student._id);
    try {
      const data = await getStudentAttendance(
        student._id,
        week === ALL_TIME ? undefined : { week: Number(week) },
      );
      const records = [...(data.data ?? [])].sort((a, b) =>
        b.date.localeCompare(a.date),
      );
      setRecordsCache((prev) => ({ ...prev, [cacheKey]: records }));
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Failed to load student attendance:", error);
      toast.error(apiError.message || `Couldn't load ${student.name}'s records`);
      setExpandedId(null);
    } finally {
      setLoadingRecordsFor(null);
    }
  };

  const filteredStudents = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    return students.filter((student) => {
      const matchesStack = activeStack
        ? normalizeStack(student.stack ?? "") === normalizeStack(activeStack)
        : true;
      const matchesSearch = term
        ? student.name.toLowerCase().includes(term) ||
          student.email.toLowerCase().includes(term)
        : true;
      return matchesStack && matchesSearch;
    });
  }, [students, searchQuery, activeStack]);

  // Only weeks the cohort has actually reached — later ones cannot have
  // attendance yet, so offering them would just produce empty tables. Wait for
  // isLoaded so the list is not built from the placeholder week 1.
  const weekOptions = useMemo(() => {
    if (!isLoaded) return [];
    const reached = Math.min(currentWeek || 1, totalWeeks || 24);
    return buildWeekOptions(reached).reverse();
  }, [isLoaded, currentWeek, totalWeeks]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-background border-border"
        />
      </div>

      {/* Stack filter, with the period picker pushed to the far end */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveStack(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeStack === null
              ? "bg-[#ffb703] text-[#08022b]"
              : "bg-card text-foreground hover:bg-muted border border-border"
          }`}
        >
          All Stacks
        </button>
        {STACKS.map((stack) => (
          <button
            key={stack}
            type="button"
            onClick={() => setActiveStack(stack)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeStack === stack
                ? "bg-[#ffb703] text-[#08022b]"
                : "bg-card text-foreground hover:bg-muted border border-border"
            }`}
          >
            {stack}
          </button>
        ))}

        {/* Week filter. A select rather than pills: a 24-week cohort would wrap
            to three rows of buttons. Matches the picker on the assessments and
            rankings pages. */}
        <div className="ml-auto flex items-center gap-2">
          <Label
            htmlFor="attendance-week-select"
            className="text-sm font-medium whitespace-nowrap"
          >
            Period:
          </Label>
          <select
            id="attendance-week-select"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value={ALL_TIME}>All time</option>
            {weekOptions.map((option) => (
              <option key={option} value={option}>
                Week {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
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
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground whitespace-nowrap">
                      S/N
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground whitespace-nowrap">
                      Name
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground whitespace-nowrap">
                      Avg Punctuality
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground whitespace-nowrap text-center">
                      Present
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground whitespace-nowrap text-center">
                      Excused
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground whitespace-nowrap text-center">
                      Missed
                    </TableHead>
                    <TableHead className="text-xs text-muted-foreground whitespace-nowrap">
                      Last Check-in
                    </TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => {
                      const isExpanded = expandedId === student._id;
                      const cacheKey = `${student._id}:${week}`;
                      const records = recordsCache[cacheKey];

                      return (
                        // The Fragment is the array element, so the key belongs
                        // here rather than on the rows inside it.
                        <Fragment key={student._id}>
                          <TableRow
                            className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer"
                            onClick={() => toggleRow(student)}
                          >
                            <TableCell className="py-3 text-sm text-muted-foreground">
                              {index + 1}
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="text-sm font-medium">
                                {student.name}
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                {student.stack}
                              </span>
                            </TableCell>
                            <TableCell className="py-3">
                              <span className="text-sm font-medium text-[#ffb703]">
                                {punctualityPercent(
                                  student.averagePunctualityScore,
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="py-3 text-center text-sm font-medium text-[#34a853]">
                              {student.presentCount}
                            </TableCell>
                            <TableCell className="py-3 text-center text-sm font-medium text-[#219ebc]">
                              {student.excusedCount}
                            </TableCell>
                            <TableCell className="py-3 text-center text-sm font-medium text-[#ec1c24]">
                              {student.missedCount}
                            </TableCell>
                            <TableCell className="py-3 text-sm text-muted-foreground whitespace-nowrap">
                              {student.lastCheckIn ?? "—"}
                            </TableCell>
                            <TableCell className="py-3 text-muted-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </TableCell>
                          </TableRow>

                          {isExpanded && (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={8} className="bg-muted/30 p-4">
                                {loadingRecordsFor === student._id ? (
                                  <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#ffb703]" />
                                  </div>
                                ) : records && records.length > 0 ? (
                                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {records.map((record) => (
                                      <StudentAttendanceCard
                                        key={record._id}
                                        record={record}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <p className="py-6 text-center text-sm text-muted-foreground">
                                    No attendance records for {student.name} in
                                    this period.
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="py-8 text-center text-muted-foreground"
                      >
                        No students found matching your search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
