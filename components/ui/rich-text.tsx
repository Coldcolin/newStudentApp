"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import {
  richTextToPlain,
  sanitizeRichText,
  type RichTextFormat,
} from "@/lib/rich-text";

// Static map — Tailwind cannot detect line-clamp classes built at runtime.
const CLAMP_CLASS: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
};

interface RichTextProps {
  content?: string | null;
  /** "html" renders formatted markup; "text" preserves the line breaks of legacy tasks. */
  format?: RichTextFormat;
  /** Render a plain-text preview clamped to this many lines instead of full markup. */
  clamp?: number;
  className?: string;
}

export function RichText({
  content,
  format = "text",
  clamp,
  className,
}: RichTextProps) {
  const value = content ?? "";

  const html = useMemo(
    () => (format === "html" && !clamp ? sanitizeRichText(value) : ""),
    [value, format, clamp],
  );

  // Clamping rendered block-level markup is unreliable, so previews use plain text.
  if (clamp) {
    return (
      <p
        className={cn(
          "text-sm text-muted-foreground",
          CLAMP_CLASS[clamp] ?? CLAMP_CLASS[2],
          className,
        )}
      >
        {richTextToPlain(value, format)}
      </p>
    );
  }

  if (format === "html") {
    return (
      <div
        className={cn("rich-text text-muted-foreground", className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <p
      className={cn(
        "text-sm text-muted-foreground whitespace-pre-wrap",
        className,
      )}
    >
      {value}
    </p>
  );
}
