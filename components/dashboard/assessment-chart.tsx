"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface AssessmentData {
  week: string;
  good: number;
  average: number;
  poor: number;
}

interface AssessmentChartProps {
  data: AssessmentData[];
  title?: string;
}

export function AssessmentChart({
  data,
  title = "Assessment Performance by Week",
}: AssessmentChartProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#687182", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#687182", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e5e5e5",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-sm text-foreground capitalize">{value}</span>
                )}
              />
              <Bar
                dataKey="good"
                fill="#34a853"
                radius={[4, 4, 0, 0]}
                name="Good (70-100%)"
              />
              <Bar
                dataKey="average"
                fill="#ffb703"
                radius={[4, 4, 0, 0]}
                name="Average (50-69%)"
              />
              <Bar
                dataKey="poor"
                fill="#ec1c24"
                radius={[4, 4, 0, 0]}
                name="Poor (0-49%)"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
