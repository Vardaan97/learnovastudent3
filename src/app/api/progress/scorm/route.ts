/**
 * POST /api/progress/scorm
 *
 * Update SCORM data for an enrollment
 * Handles bookmark, suspend data, time tracking, scores, and status
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

const scormDataSchema = z.object({
  enrollmentId: z.string().uuid(),
  lessonLocation: z.string().optional(),
  suspendData: z.record(z.string(), z.unknown()).optional(),
  sessionTime: z.number().int().min(0).optional(), // seconds to add to total time
  score: z.number().min(0).max(100).optional(),
  completionStatus: z.enum(['incomplete', 'completed']).optional(),
  successStatus: z.enum(['unknown', 'passed', 'failed']).optional(),
  progressMeasure: z.number().min(0).max(1).optional(),
});

export async function POST(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const { data: body, error: validationError } = await parseBody(request, scormDataSchema);
  if (validationError) return validationError;

  // Verify enrollment belongs to user
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id, user_id, scorm_total_time')
    .eq('id', body.enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    return errorResponse('Enrollment not found', 404, 'NOT_FOUND');
  }

  if (enrollment.user_id !== user.id) {
    return forbiddenResponse('You do not have access to this enrollment');
  }

  // Build update data
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.lessonLocation !== undefined) {
    updateData.scorm_lesson_location = body.lessonLocation;
  }

  if (body.suspendData !== undefined) {
    updateData.scorm_suspend_data = body.suspendData;
  }

  if (body.sessionTime !== undefined) {
    // Add session time to total time
    const currentTime = enrollment.scorm_total_time ?? 0;
    updateData.scorm_total_time = currentTime + body.sessionTime;
  }

  if (body.score !== undefined) {
    updateData.scorm_score = body.score;
  }

  if (body.completionStatus !== undefined) {
    updateData.scorm_completion_status = body.completionStatus;

    // Update enrollment status based on SCORM completion
    if (body.completionStatus === 'completed') {
      updateData.status = 'completed';
      updateData.completed_at = new Date().toISOString();
    }
  }

  if (body.successStatus !== undefined) {
    updateData.scorm_success_status = body.successStatus;
  }

  if (body.progressMeasure !== undefined) {
    // Convert progress measure (0-1) to percentage (0-100)
    updateData.progress = Math.round(body.progressMeasure * 100);

    // Update status based on progress
    if (body.progressMeasure > 0 && body.progressMeasure < 1) {
      updateData.status = 'in_progress';
      // Set started_at if not already set
      const { data: currentEnrollment } = await supabase
        .from('enrollments')
        .select('started_at')
        .eq('id', body.enrollmentId)
        .single();

      if (!currentEnrollment?.started_at) {
        updateData.started_at = new Date().toISOString();
      }
    }
  }

  // Update enrollment
  const { data: updatedEnrollment, error: updateError } = await supabase
    .from('enrollments')
    .update(updateData)
    .eq('id', body.enrollmentId)
    .select(`
      id,
      status,
      progress,
      scorm_lesson_location,
      scorm_suspend_data,
      scorm_total_time,
      scorm_score,
      scorm_completion_status,
      scorm_success_status
    `)
    .single();

  if (updateError) {
    return errorResponse('Failed to update SCORM data', 500, 'UPDATE_ERROR');
  }

  return jsonResponse(updatedEnrollment);
}

/**
 * GET /api/progress/scorm?enrollmentId=xxx
 *
 * Get SCORM data for an enrollment (for resume functionality)
 */
export async function GET(request: NextRequest) {
  const { user, supabase, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const enrollmentId = request.nextUrl.searchParams.get('enrollmentId');
  if (!enrollmentId) {
    return errorResponse('enrollmentId is required', 400, 'VALIDATION_ERROR');
  }

  // Get enrollment SCORM data
  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select(`
      id,
      user_id,
      status,
      progress,
      scorm_lesson_location,
      scorm_suspend_data,
      scorm_total_time,
      scorm_score,
      scorm_completion_status,
      scorm_success_status
    `)
    .eq('id', enrollmentId)
    .single();

  if (error || !enrollment) {
    return errorResponse('Enrollment not found', 404, 'NOT_FOUND');
  }

  if (enrollment.user_id !== user.id) {
    return forbiddenResponse('You do not have access to this enrollment');
  }

  return jsonResponse({
    lessonLocation: enrollment.scorm_lesson_location,
    suspendData: enrollment.scorm_suspend_data,
    totalTime: enrollment.scorm_total_time,
    score: enrollment.scorm_score,
    completionStatus: enrollment.scorm_completion_status,
    successStatus: enrollment.scorm_success_status,
    progress: enrollment.progress,
    status: enrollment.status,
  });
}
