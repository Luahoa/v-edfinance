'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface StudentRosterItem {
  userId: string;
  name: string;
  email: string;
  enrolledAt: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  lastActivity: string;
  completed: boolean;
}

interface CourseRosterResponse {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  students: StudentRosterItem[];
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    totalStudents: number;
  };
}

export default function CourseRosterPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [roster, setRoster] = useState<CourseRosterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'enrolledAt' | 'progress' | 'lastActivity' | 'name'>('enrolledAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const limit = 20;

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchRoster depends on courseId from params
  useEffect(() => {
    fetchRoster();
  }, [page, sortBy, sortOrder]);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy,
        sortOrder,
        ...(search && { search }),
      });

      const response = await fetch(`/api/courses/${courseId}/roster?${query}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch roster');

      const data = await response.json();
      setRoster(data);
    } catch (error) {
      console.error('Error fetching roster:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1); // Reset to first page on new search
    fetchRoster();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
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

  if (loading && !roster) {
    return (
      <div className="container mx-auto max-w-7xl p-6">
        <Skeleton className="mb-6 h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-4 h-10 w-full" />
            {/* biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton list */}
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Danh sách học viên
        </h1>
        <p className="mt-2 text-gray-600">
          {roster?.courseTitle} • {roster?.totalStudents} học viên
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quản lý học viên</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters & Search */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên hoặc email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>Tìm</Button>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enrolledAt">Ngày đăng ký</SelectItem>
                  <SelectItem value="progress">Tiến độ</SelectItem>
                  <SelectItem value="lastActivity">Hoạt động</SelectItem>
                  <SelectItem value="name">Tên</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortOrder} onValueChange={(value: typeof sortOrder) => setSortOrder(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Tăng dần</SelectItem>
                  <SelectItem value="desc">Giảm dần</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead>Tiến độ</TableHead>
                  <TableHead>Bài học</TableHead>
                  <TableHead>Hoạt động gần nhất</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(roster?.students || []).map((student) => (
                  <TableRow key={student.userId}>
                    {/* Student Info */}
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </div>
                    </TableCell>

                    {/* Enrolled Date */}
                    <TableCell className="text-sm text-gray-600">
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
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(student.progress)}%
                        </span>
                      </div>
                    </TableCell>

                    {/* Lessons */}
                    <TableCell className="text-sm text-gray-600">
                      {student.completedLessons}/{student.totalLessons}
                    </TableCell>

                    {/* Last Activity */}
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(student.lastActivity)}
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      {student.completed ? (
                        <Badge className="bg-green-600">
                          Hoàn thành
                        </Badge>
                      ) : student.progress > 0 ? (
                        <Badge variant="secondary">
                          Đang học
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          Chưa bắt đầu
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {roster?.students.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Không tìm thấy học viên
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {roster && roster.pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Trang {roster.pagination.currentPage} / {roster.pagination.totalPages}
                {' • '}
                {roster.totalStudents} học viên
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === roster.pagination.totalPages}
                >
                  Sau
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
