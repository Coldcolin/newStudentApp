"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  iconBgColor = "bg-[#ffb703]/10",
  iconColor = "text-[#ffb703]",
}: StatsCardProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p
                className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-[#34a853]" : "text-[#ec1c24]"
                )}
              >
                {trend.isPositive ? "+" : "-"}
                {Math.abs(trend.value)}%{" "}
                <span className="text-muted-foreground">from last month</span>
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              iconBgColor
            )}
          >
            <Icon className={cn("h-7 w-7", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
