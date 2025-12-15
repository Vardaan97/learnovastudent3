/**
 * POST /api/progress/lesson
 *
 * Update lesson progress (for video tracking, article reading, etc.)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  requireAuth,
  parseBody,
  jsonResponse,
  errorResponse,
  forbiddenResponse,
} from '@/lib/api/utils';

const updateProgressSchema = z.object({
  enrollmentId: z.string().uuid(),
  lessonId: z.string().uuid(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  progressPercent: z.number().int().min(0).max(100).optional(),
  lastPosition: z.number().int().min(0).optional(),
  watchedDuration: z.number().int().min(0).optional(),
});

export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { data: body, error: validationError } = await parseBody(request, updateProgressSchema);
  if (validationError) return validationError;

  // Verify enrollment belongs to user
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, user_id, course_id')
    .eq('id', body.enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    return errorResponse('Enrollment not found', 404, 'NOT_FOUND');
  }

  if (enrollment.user_id !== user.id) {
    return forbiddenResponse('You do not have access to this enrollment');
  }

  // Upsert lesson progress
  const now = new Date().toISOString();
  const progressData: Record<string, unknown> = {
    user_id: user.id,
    enrollment_id: body.enrollmentId,
    lesson_id: body.lessonId,
    last_accessed_at: now,
  };

  if (body.status) progressData.status = body.status;
  if (body.progressPercent !== undefined) progressData.progress_percent = body.progressPercent;
  if (body.lastPosition !== undefined) progressData.last_position = body.lastPosition;
  if (body.watchedDuration !== undefined) progressData.watched_duration = body.watchedDuration;

  // Set timestamps based on status
  if (body.status === 'in_progress') {
    progressData.started_at = now;
  }
  if (body.status === 'completed') {
    progressData.completed_at = now;
  }

  const { data: progress, error: upsertError } = await supabase
    .from('lesson_progress')
    .upsert(progressData, {
      onConflict: 'user_id,lesson_id',
    })
    .select()
    .single();

  if (upsertError) {
    return errorResponse('Failed to update progress', 500, 'UPDATE_ERROR');
  }

  // Update enrollment progress
  await updateEnrollmentProgress(supabase, body.enrollmentId, enrollment.course_id);

  return jsonResponse(progress);
}

/**
 * Recalculate and update enrollment progress based on completed lessons
 */
async function updateEnrollmentProgress(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  enrollmentId: string,
  courseId: string
) {
  // Get total lessons in course
  const { data: course } = await supabase
    .from('courses')
    .select('total_lessons')
    .eq('id', courseId)
    .single();

  if (!course || course.total_lessons === 0) return;

  // Count completed lessons for this enrollment
  const { count: completedLessons } = await supabase
    .from('lesson_progress')
    .select('*', { count: 'exact', head: true })
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'completed');

  // Calculate progress percentage
  const progress = Math.round((completedLessons ?? 0) / course.total_lessons * 100);

  // Determine status
  let status = 'in_progress';
  if (progress === 0) status = 'not_started';
  if (progress === 100) status = 'completed';

  const updateData: Record<string, unknown> = {
    progress,
    status,
    updated_at: new Date().toISOString(),
  };

  // Set completion date if completed
  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
    updateData.scorm_completion_status = 'completed';
  } else if (status === 'in_progress') {
    // Set started date if not already set
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('started_at')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment?.started_at) {
      updateData.started_at = new Date().toISOString();
    }
    updateData.scorm_completion_status = 'incomplete';
  }

  // Update enrollment
  await supabase
    .from('enrollments')
    .update(updateData)
    .eq('id', enrollmentId);
}
