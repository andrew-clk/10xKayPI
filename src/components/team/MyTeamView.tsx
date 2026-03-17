'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Mail,
  Phone,
  Building,
  Calendar,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ChevronRight,
  Edit,
  TrendingUp,
  Award
} from 'lucide-react';
import type { Employee, KpiTemplate, Department } from '@/types';
import { GRADE_COLORS } from '@/utils/score';
import { getRoleDisplayName, getRoleBadgeColor } from '@/lib/rbac';

interface ReviewStatus {
  reviewId: string;
  selfRatingStatus: string;
  supervisorRatingStatus: string;
  finalScore: string | null;
  performanceGrade: string | null;
  employeeAcknowledged: boolean;
}

interface Props {
  user: Employee;
  teamMembers: Employee[];
  kpiTemplates: KpiTemplate[];
  departments: Department[];
  reviewStatusMap: Record<string, ReviewStatus>;
  currentPeriod: any | null;
}

export function MyTeamView({
  user,
  teamMembers,
  kpiTemplates,
  departments,
  reviewStatusMap,
  currentPeriod
}: Props) {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [updatingTemplates, setUpdatingTemplates] = useState<Record<string, boolean>>({});

  // Calculate review statistics
  const stats = {
    totalMembers: teamMembers.length,
    pendingReviews: Object.values(reviewStatusMap).filter(r =>
      r.selfRatingStatus === 'submitted' && r.supervisorRatingStatus !== 'submitted'
    ).length,
    completedReviews: Object.values(reviewStatusMap).filter(r =>
      r.supervisorRatingStatus === 'submitted'
    ).length,
    notStarted: Object.values(reviewStatusMap).filter(r =>
      r.selfRatingStatus === 'not_started'
    ).length,
  };

  // Filter team members based on selected tab
  const filteredMembers = teamMembers.filter(member => {
    const review = reviewStatusMap[member.id];
    if (selectedTab === 'pending') {
      return review && review.selfRatingStatus === 'submitted' && review.supervisorRatingStatus !== 'submitted';
    }
    if (selectedTab === 'completed') {
      return review && review.supervisorRatingStatus === 'submitted';
    }
    return true;
  });

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getReviewStatusIcon = (review: ReviewStatus | undefined) => {
    if (!review) return <XCircle className="h-5 w-5 text-slate-400" />;

    if (review.supervisorRatingStatus === 'submitted') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (review.selfRatingStatus === 'submitted') {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
    if (review.selfRatingStatus === 'in_progress') {
      return <Clock className="h-5 w-5 text-blue-600" />;
    }
    return <XCircle className="h-5 w-5 text-slate-400" />;
  };

  const getReviewStatusLabel = (review: ReviewStatus | undefined) => {
    if (!review) return 'No Review';

    if (review.supervisorRatingStatus === 'submitted') {
      return 'Completed';
    }
    if (review.selfRatingStatus === 'submitted') {
      return 'Pending Your Rating';
    }
    if (review.selfRatingStatus === 'in_progress') {
      return 'Self-Rating In Progress';
    }
    return 'Not Started';
  };

  const getReviewStatusColor = (review: ReviewStatus | undefined) => {
    if (!review) return 'bg-slate-100 text-slate-600';

    if (review.supervisorRatingStatus === 'submitted') {
      return 'bg-green-100 text-green-800';
    }
    if (review.selfRatingStatus === 'submitted') {
      return 'bg-yellow-100 text-yellow-800';
    }
    if (review.selfRatingStatus === 'in_progress') {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-slate-100 text-slate-600';
  };

  async function handleTemplateChange(employeeId: string, templateId: string | null) {
    setUpdatingTemplates(prev => ({ ...prev, [employeeId]: true }));

    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpiTemplateId: templateId === 'none' ? null : templateId }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to update KPI template');
        return;
      }

      toast.success('KPI template updated successfully');
      router.refresh();
    } catch {
      toast.error('Failed to update KPI template');
    } finally {
      setUpdatingTemplates(prev => ({ ...prev, [employeeId]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Team</h1>
        <p className="text-slate-500 mt-1">
          Manage your direct reports, assign KPI templates, and track review progress.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalMembers}</p>
                <p className="text-xs text-slate-500">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-800">{stats.pendingReviews}</p>
                <p className="text-xs text-slate-600">Pending Your Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800">{stats.completedReviews}</p>
                <p className="text-xs text-slate-600">Completed Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.notStarted}</p>
                <p className="text-xs text-slate-500">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentPeriod && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Current Review Period:</span>
            <span className="text-blue-700">{currentPeriod.periodName}</span>
            <span className="text-blue-600 text-sm ml-auto">Due: {currentPeriod.reviewDueDate}</span>
          </div>
        </div>
      )}

      {/* Tabs for filtering */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All Members ({teamMembers.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Reviews ({stats.pendingReviews})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({stats.completedReviews})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          <div className="grid gap-4">
            {filteredMembers.map(member => {
              const review = reviewStatusMap[member.id];
              const department = departments.find(d => d.id === member.departmentId);
              const currentTemplate = kpiTemplates.find(t => t.id === member.kpiTemplateId);

              return (
                <Card key={member.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Employee Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.photoUrl || undefined} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-700">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 space-y-2">
                          <div>
                            <h3 className="font-semibold text-lg">{member.fullName}</h3>
                            <p className="text-sm text-slate-600">{member.position}</p>
                          </div>

                          <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {member.email}
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                {member.phone}
                              </div>
                            )}
                            {department && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3.5 w-3.5" />
                                {department.name}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className={getRoleBadgeColor(member.role)}>
                              {getRoleDisplayName(member.role)}
                            </Badge>
                            {member.status !== 'active' && (
                              <Badge variant="outline" className="text-red-600 border-red-300">
                                {member.status}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* KPI Template Assignment */}
                      <div className="flex-1 lg:max-w-xs space-y-3">
                        <div>
                          <label className="text-sm font-medium text-slate-700 flex items-center gap-1 mb-1">
                            <Target className="h-4 w-4" />
                            KPI Template
                          </label>
                          <Select
                            value={member.kpiTemplateId || 'none'}
                            onValueChange={(value) => handleTemplateChange(member.id, value)}
                            disabled={updatingTemplates[member.id]}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {currentTemplate ? currentTemplate.name : 'No template assigned'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No template</SelectItem>
                              {kpiTemplates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                  {template.name} ({template.positionType})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Review Status */}
                        {currentPeriod && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-slate-700">Review Status</span>
                              {getReviewStatusIcon(review)}
                            </div>

                            <div className="flex items-center gap-2">
                              <Badge className={`${getReviewStatusColor(review)} text-xs`}>
                                {getReviewStatusLabel(review)}
                              </Badge>

                              {review?.performanceGrade && (
                                <Badge className={`${GRADE_COLORS[review.performanceGrade as any]} text-xs font-bold`}>
                                  Grade {review.performanceGrade}
                                </Badge>
                              )}
                            </div>

                            {review?.finalScore && (
                              <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-slate-500" />
                                <span className="text-sm font-medium">
                                  Score: {parseFloat(review.finalScore).toFixed(1)}
                                </span>
                              </div>
                            )}

                            {review && (
                              <div className="flex gap-2 pt-1">
                                {review.selfRatingStatus === 'submitted' &&
                                 review.supervisorRatingStatus !== 'submitted' && (
                                  <Button
                                    asChild
                                    size="sm"
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    <Link href={`/dashboard/reviews/${review.reviewId}/supervisor-rating`}>
                                      Rate Now <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                    </Link>
                                  </Button>
                                )}

                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <Link href={`/dashboard/reviews/${review.reviewId}`}>
                                    View Details
                                  </Link>
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2 lg:gap-2">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:flex-initial"
                        >
                          <Link href={`/dashboard/employees?search=${encodeURIComponent(member.email)}`}>
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No team members found in this category.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}