'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Search, ChevronLeft, ChevronRight, Download, Calendar, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

type StatusFilter = 'all' | 'completed' | 'inProgress' | 'notStarted';

export default function CourseRosterPage() {
  const params = useParams();
  const courseId = params.id as string;
  const locale = useLocale() as 'vi' | 'en' | 'zh';
  const t = useTranslations('Roster');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'enrolledAt' | 'progress' | 'lastActivity' | 'name'>('enrolledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data: roster, isLoading } = trpc.course.getRoster.useQuery({
    courseId,
    page,
    limit,
    search: search || undefined,
    status: statusFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    sortBy,
    sortOrder,
  });

  const { refetch: fetchCsv, isFetching: isExporting } = trpc.course.exportRosterCsv.useQuery(
    { courseId, locale },
    { enabled: false }
  );

  const handleSearch = () => {
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || dateFrom || dateTo;

  const handleExport = async () => {
    const result = await fetchCsv();
    if (result.data) {
      const blob = new Blob([result.data.content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = result.data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'vi' ? 'vi-VN' : locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 20) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (isLoading && !roster) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Skeleton className="mb-6 h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-4 h-10 w-full" />
            {[...Array(5)].map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className="mb-2 h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {roster?.courseTitle} • {roster?.totalStudents} {t('students')}
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? t('exporting') : t('exportCsv')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('manageStudents')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters & Search */}
          <div className="mb-6 space-y-4">
            {/* Row 1: Search + Status Filter */}
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Search */}
              <div className="flex flex-1 gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>{t('search')}</Button>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => { setStatusFilter(value); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder={t('filterStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('filterAll')}</SelectItem>
                  <SelectItem value="completed">{t('statusCompleted')}</SelectItem>
                  <SelectItem value="inProgress">{t('statusInProgress')}</SelectItem>
                  <SelectItem value="notStarted">{t('statusNotStarted')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Date Range + Sort + Clear */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Date Range */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                  className="w-[140px]"
                  aria-label={t('dateFrom')}
                />
                <span className="text-gray-500">—</span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                  className="w-[140px]"
                  aria-label={t('dateTo')}
                />
              </div>

              {/* Sort + Clear */}
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolledAt">{t('sortEnrolledAt')}</SelectItem>
                    <SelectItem value="progress">{t('sortProgress')}</SelectItem>
                    <SelectItem value="lastActivity">{t('sortLastActivity')}</SelectItem>
                    <SelectItem value="name">{t('sortName')}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(value: typeof sortOrder) => setSortOrder(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('ascending')}</SelectItem>
                    <SelectItem value="desc">{t('descending')}</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="icon" onClick={handleClearFilters} aria-label={t('clearFilters')}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('student')}</TableHead>
                  <TableHead>{t('enrolledDate')}</TableHead>
                  <TableHead>{t('progress')}</TableHead>
                  <TableHead>{t('lessons')}</TableHead>
                  <TableHead>{t('lastActivity')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(roster?.students || []).map((student) => (
                  <TableRow key={student.userId}>
                    {/* Student Info */}
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </TableCell>

                    {/* Enrolled Date */}
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(student.enrolledAt)}
                    </TableCell>

                    {/* Progress Bar */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={student.progress}
                          className="h-2 w-24"
                          indicatorClassName={getProgressColor(student.progress)}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {Math.round(student.progress)}%
                        </span>
                      </div>
                    </TableCell>

                    {/* Lessons */}
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {student.completedLessons}/{student.totalLessons}
                    </TableCell>

                    {/* Last Activity */}
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(student.lastActivity)}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {student.completed ? (
                        <Badge className="bg-green-600">
                          {t('statusCompleted')}
                        </Badge>
                      ) : student.progress > 0 ? (
                        <Badge variant="secondary">
                          {t('statusInProgress')}
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {t('statusNotStarted')}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {roster?.students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {t('noStudents')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {roster && roster.pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('page')} {roster.pagination.currentPage} / {roster.pagination.totalPages}
                {' • '}
                {roster.totalStudents} {t('students')}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t('previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === roster.pagination.totalPages}
                >
                  {t('next')}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
