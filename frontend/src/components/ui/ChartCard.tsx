import type { ReactNode } from "react";
import { classNames } from "@/utils";
import { Alert } from "./Alert";
import { Button } from "./Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./Card";
import { EmptyState } from "./EmptyState";
import { Skeleton } from "./Skeleton";

export interface ChartCardProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Chart area height. Numbers are treated as pixels. */
  height?: number | string;
  loading?: boolean;
  error?: ReactNode;
  onRetry?: () => void;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyIcon?: ReactNode;
  /** Optional accessible data table shown in a disclosure below the chart. */
  dataTable?: ReactNode;
  className?: string;
  children: ReactNode;
}

/**
 * Consistent shell for dashboard charts: header, loading/error/empty states,
 * a bounded responsive chart area and an optional data-table alternative.
 * The actual chart (recharts) is passed as children, so this stays
 * library-agnostic and adds no dependency.
 */
export function ChartCard({
  title,
  description,
  actions,
  height = 288,
  loading = false,
  error,
  onRetry,
  empty = false,
  emptyTitle = "No data available",
  emptyDescription,
  emptyIcon,
  dataTable,
  className,
  children,
}: ChartCardProps) {
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;

  return (
    <Card className={classNames("overflow-hidden", className)}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>

        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading chart...</span>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="w-full" style={{ height: resolvedHeight }} />
          </div>
        ) : error ? (
          <Alert tone="danger">
            <div className="flex flex-wrap items-center gap-3">
              <span>{error}</span>
              {onRetry && (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              )}
            </div>
          </Alert>
        ) : empty ? (
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            icon={emptyIcon}
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <>
            <div className="w-full min-w-0" style={{ height: resolvedHeight }}>
              {children}
            </div>

            {dataTable && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-ink-600">
                  View data as a table
                </summary>
                <div className="mt-3 max-h-64 overflow-auto scrollbar-subtle">
                  {dataTable}
                </div>
              </details>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
