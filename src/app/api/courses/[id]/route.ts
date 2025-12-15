/**
 * GET /api/courses/[id]
 *
 * Get detailed course information including modules and lessons
 */

import { NextRequest } from 'next/server';
import { requireAuth, jsonResponse, notFoundResponse } from '@/lib/api/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { supabase, error: authError } = await requireAuth(request);
  if (authError) return authError;

  // Get course with modules and lessons
  const { data: course, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id,
        number,
        title,
        description,
        estimated_minutes,
        sort_order,
        lessons (
          id,
          title,
          description,
          content_type,
          video_duration,
          sort_order
        ),
        quizzes (
          id,
          title,
          description,
          time_limit_minutes,
          passing_score
        )
      )
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error || !course) {
    return notFoundResponse('Course not found');
  }

  // Sort modules and their content
  if (course.modules) {
    course.modules.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
    course.modules.forEach((module: { lessons?: { sort_order: number }[] }) => {
      if (module.lessons) {
        module.lessons.sort((a, b) => a.sort_order - b.sort_order);
      }
    });
  }

  return jsonResponse(course);
}
