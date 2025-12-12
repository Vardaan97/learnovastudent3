/**
 * Supabase Database Types
 * =======================
 *
 * Auto-generated types for Supabase tables.
 * This file should be identical across all three apps.
 *
 * To regenerate after schema changes:
 * npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          slug: string;
          industry: string;
          size: string;
          logo_url: string | null;
          favicon_url: string | null;
          branding: Json;
          features: Json;
          admin_email: string;
          support_email: string;
          subscription_tier: 'starter' | 'professional' | 'enterprise';
          subscription_status: 'active' | 'trial' | 'expired' | 'cancelled';
          trial_ends_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          industry?: string;
          size?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          branding?: Json;
          features?: Json;
          admin_email: string;
          support_email?: string;
          subscription_tier?: 'starter' | 'professional' | 'enterprise';
          subscription_status?: 'active' | 'trial' | 'expired' | 'cancelled';
          trial_ends_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          industry?: string;
          size?: string;
          logo_url?: string | null;
          favicon_url?: string | null;
          branding?: Json;
          features?: Json;
          admin_email?: string;
          support_email?: string;
          subscription_tier?: 'starter' | 'professional' | 'enterprise';
          subscription_status?: 'active' | 'trial' | 'expired' | 'cancelled';
          trial_ends_at?: string | null;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string | null;
          first_name: string;
          last_name: string;
          avatar_url: string | null;
          company_id: string;
          role: 'learner' | 'team_lead' | 'manager' | 'company_admin' | 'coordinator' | 'koenig_sales' | 'koenig_admin';
          department: string | null;
          job_title: string | null;
          auth_provider: 'email' | 'workos' | 'google' | 'microsoft';
          auth_provider_id: string | null;
          email_verified: boolean;
          preferences: Json;
          status: 'active' | 'inactive' | 'suspended';
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash?: string | null;
          first_name: string;
          last_name: string;
          avatar_url?: string | null;
          company_id: string;
          role?: 'learner' | 'team_lead' | 'manager' | 'company_admin' | 'coordinator' | 'koenig_sales' | 'koenig_admin';
          department?: string | null;
          job_title?: string | null;
          auth_provider?: 'email' | 'workos' | 'google' | 'microsoft';
          auth_provider_id?: string | null;
          email_verified?: boolean;
          preferences?: Json;
          status?: 'active' | 'inactive' | 'suspended';
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          password_hash?: string | null;
          first_name?: string;
          last_name?: string;
          avatar_url?: string | null;
          company_id?: string;
          role?: 'learner' | 'team_lead' | 'manager' | 'company_admin' | 'coordinator' | 'koenig_sales' | 'koenig_admin';
          department?: string | null;
          job_title?: string | null;
          auth_provider?: 'email' | 'workos' | 'google' | 'microsoft';
          auth_provider_id?: string | null;
          email_verified?: boolean;
          preferences?: Json;
          status?: 'active' | 'inactive' | 'suspended';
          last_login_at?: string | null;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          code: string;
          name: string;
          short_description: string;
          full_description: string;
          thumbnail_url: string | null;
          category: string;
          vendor: string;
          estimated_hours: number;
          total_lessons: number;
          total_modules: number;
          level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          prerequisites: string[];
          certification_name: string;
          certification_vendor: string;
          exam_code: string | null;
          price: number | null;
          currency: string;
          status: 'draft' | 'published' | 'archived';
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          short_description?: string;
          full_description?: string;
          thumbnail_url?: string | null;
          category?: string;
          vendor?: string;
          estimated_hours?: number;
          total_lessons?: number;
          total_modules?: number;
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          prerequisites?: string[];
          certification_name?: string;
          certification_vendor?: string;
          exam_code?: string | null;
          price?: number | null;
          currency?: string;
          status?: 'draft' | 'published' | 'archived';
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          short_description?: string;
          full_description?: string;
          thumbnail_url?: string | null;
          category?: string;
          vendor?: string;
          estimated_hours?: number;
          total_lessons?: number;
          total_modules?: number;
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
          prerequisites?: string[];
          certification_name?: string;
          certification_vendor?: string;
          exam_code?: string | null;
          price?: number | null;
          currency?: string;
          status?: 'draft' | 'published' | 'archived';
          published_at?: string | null;
          updated_at?: string;
        };
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          number: number;
          title: string;
          description: string;
          estimated_minutes: number;
          sort_order: number;
          status: 'draft' | 'published';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          number: number;
          title: string;
          description?: string;
          estimated_minutes?: number;
          sort_order?: number;
          status?: 'draft' | 'published';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          course_id?: string;
          number?: number;
          title?: string;
          description?: string;
          estimated_minutes?: number;
          sort_order?: number;
          status?: 'draft' | 'published';
          updated_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string;
          content_type: 'video' | 'article' | 'interactive' | 'lab';
          video_url: string | null;
          video_provider: 'youtube' | 'vimeo' | 'custom' | null;
          video_duration: number | null;
          article_content: string | null;
          resources: Json;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          description?: string;
          content_type?: 'video' | 'article' | 'interactive' | 'lab';
          video_url?: string | null;
          video_provider?: 'youtube' | 'vimeo' | 'custom' | null;
          video_duration?: number | null;
          article_content?: string | null;
          resources?: Json;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          module_id?: string;
          title?: string;
          description?: string;
          content_type?: 'video' | 'article' | 'interactive' | 'lab';
          video_url?: string | null;
          video_provider?: 'youtube' | 'vimeo' | 'custom' | null;
          video_duration?: number | null;
          article_content?: string | null;
          resources?: Json;
          sort_order?: number;
          updated_at?: string;
        };
      };
      quizzes: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string;
          time_limit_minutes: number | null;
          passing_score: number;
          max_attempts: number | null;
          shuffle_questions: boolean;
          show_correct_answers: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          description?: string;
          time_limit_minutes?: number | null;
          passing_score?: number;
          max_attempts?: number | null;
          shuffle_questions?: boolean;
          show_correct_answers?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          module_id?: string;
          title?: string;
          description?: string;
          time_limit_minutes?: number | null;
          passing_score?: number;
          max_attempts?: number | null;
          shuffle_questions?: boolean;
          show_correct_answers?: boolean;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank';
          options: Json;
          correct_answers: string[];
          explanation: string | null;
          points: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          question_type?: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank';
          options?: Json;
          correct_answers: string[];
          explanation?: string | null;
          points?: number;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          quiz_id?: string;
          question_text?: string;
          question_type?: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank';
          options?: Json;
          correct_answers?: string[];
          explanation?: string | null;
          points?: number;
          sort_order?: number;
          updated_at?: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          company_id: string;
          status: 'not_started' | 'in_progress' | 'completed' | 'expired';
          progress: number;
          enrolled_at: string;
          started_at: string | null;
          completed_at: string | null;
          expires_at: string | null;
          certificate_id: string | null;
          certificate_issued_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          company_id: string;
          status?: 'not_started' | 'in_progress' | 'completed' | 'expired';
          progress?: number;
          enrolled_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          certificate_id?: string | null;
          certificate_issued_at?: string | null;
        };
        Update: {
          user_id?: string;
          course_id?: string;
          company_id?: string;
          status?: 'not_started' | 'in_progress' | 'completed' | 'expired';
          progress?: number;
          started_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
          certificate_id?: string | null;
          certificate_issued_at?: string | null;
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          lesson_id: string;
          enrollment_id: string;
          status: 'not_started' | 'in_progress' | 'completed';
          progress_percent: number;
          last_position: number;
          watched_duration: number;
          started_at: string | null;
          completed_at: string | null;
          last_accessed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          lesson_id: string;
          enrollment_id: string;
          status?: 'not_started' | 'in_progress' | 'completed';
          progress_percent?: number;
          last_position?: number;
          watched_duration?: number;
          started_at?: string | null;
          completed_at?: string | null;
          last_accessed_at?: string;
        };
        Update: {
          status?: 'not_started' | 'in_progress' | 'completed';
          progress_percent?: number;
          last_position?: number;
          watched_duration?: number;
          started_at?: string | null;
          completed_at?: string | null;
          last_accessed_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          user_id: string;
          quiz_id: string;
          enrollment_id: string;
          score: number;
          passed: boolean;
          total_questions: number;
          correct_answers: number;
          answers: Json;
          started_at: string;
          completed_at: string;
          duration_seconds: number;
          attempt_number: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          quiz_id: string;
          enrollment_id: string;
          score: number;
          passed: boolean;
          total_questions: number;
          correct_answers: number;
          answers?: Json;
          started_at: string;
          completed_at: string;
          duration_seconds: number;
          attempt_number?: number;
        };
        Update: {
          score?: number;
          passed?: boolean;
          total_questions?: number;
          correct_answers?: number;
          answers?: Json;
          completed_at?: string;
          duration_seconds?: number;
        };
      };
      gamification_profiles: {
        Row: {
          id: string;
          user_id: string;
          total_xp: number;
          current_level: number;
          xp_to_next_level: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          total_study_minutes: number;
          total_lessons_completed: number;
          total_quizzes_passed: number;
          total_achievements: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_xp?: number;
          current_level?: number;
          xp_to_next_level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          total_study_minutes?: number;
          total_lessons_completed?: number;
          total_quizzes_passed?: number;
          total_achievements?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          total_xp?: number;
          current_level?: number;
          xp_to_next_level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          total_study_minutes?: number;
          total_lessons_completed?: number;
          total_quizzes_passed?: number;
          total_achievements?: number;
          updated_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string;
          icon: string;
          xp_reward: number;
          rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
          category: string;
          criteria: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description: string;
          icon?: string;
          xp_reward?: number;
          rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
          category?: string;
          criteria?: Json;
          created_at?: string;
        };
        Update: {
          code?: string;
          name?: string;
          description?: string;
          icon?: string;
          xp_reward?: number;
          rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
          category?: string;
          criteria?: Json;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          xp_awarded: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          xp_awarded?: number;
        };
        Update: {
          xp_awarded?: number;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          company_id: string | null;
          action: string;
          resource: string;
          resource_id: string;
          details: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          company_id?: string | null;
          action: string;
          resource: string;
          resource_id: string;
          details?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      portal_access: {
        Row: {
          id: string;
          company_id: string;
          user_id: string;
          portal_type: 'student' | 'coordinator' | 'admin';
          access_url: string;
          temp_password: string | null;
          password_changed: boolean;
          last_accessed_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          user_id: string;
          portal_type: 'student' | 'coordinator' | 'admin';
          access_url: string;
          temp_password?: string | null;
          password_changed?: boolean;
          last_accessed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          portal_type?: 'student' | 'coordinator' | 'admin';
          access_url?: string;
          temp_password?: string | null;
          password_changed?: boolean;
          last_accessed_at?: string | null;
          updated_at?: string;
        };
      };
      // ========================================
      // V2 OPTIMIZED TABLES (External Media)
      // ========================================
      media_references: {
        Row: {
          id: string;
          title: string;
          description: string;
          media_type: 'video' | 'document' | 'image' | 'audio' | 'presentation';
          provider: 'youtube' | 'vimeo' | 's3' | 'google_drive' | 'onedrive' | 'external_url';
          external_id: string | null;
          external_url: string;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          thumbnail_url: string | null;
          course_id: string | null;
          module_id: string | null;
          lesson_id: string | null;
          is_public: boolean;
          requires_auth: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          media_type: 'video' | 'document' | 'image' | 'audio' | 'presentation';
          provider: 'youtube' | 'vimeo' | 's3' | 'google_drive' | 'onedrive' | 'external_url';
          external_id?: string | null;
          external_url: string;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          thumbnail_url?: string | null;
          course_id?: string | null;
          module_id?: string | null;
          lesson_id?: string | null;
          is_public?: boolean;
          requires_auth?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          media_type?: 'video' | 'document' | 'image' | 'audio' | 'presentation';
          provider?: 'youtube' | 'vimeo' | 's3' | 'google_drive' | 'onedrive' | 'external_url';
          external_id?: string | null;
          external_url?: string;
          duration_seconds?: number | null;
          thumbnail_url?: string | null;
          updated_at?: string;
        };
      };
      question_bank: {
        Row: {
          id: string;
          question_text: string;
          question_type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'ordering';
          options: Json;
          correct_answer_ids: string[];
          explanation: string | null;
          course_code: string | null;
          topic: string | null;
          subtopic: string | null;
          difficulty: 'easy' | 'medium' | 'hard' | 'expert';
          tags: string[];
          source: string | null;
          source_reference: string | null;
          points: number;
          negative_marking: number;
          status: 'active' | 'draft' | 'archived' | 'deprecated';
          image_url: string | null;
          created_by: string | null;
          reviewed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_text: string;
          question_type?: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'ordering';
          options?: Json;
          correct_answer_ids: string[];
          explanation?: string | null;
          course_code?: string | null;
          topic?: string | null;
          subtopic?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
          tags?: string[];
          source?: string | null;
          source_reference?: string | null;
          points?: number;
          negative_marking?: number;
          status?: 'active' | 'draft' | 'archived' | 'deprecated';
          image_url?: string | null;
          created_by?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          question_text?: string;
          question_type?: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'ordering';
          options?: Json;
          correct_answer_ids?: string[];
          explanation?: string | null;
          course_code?: string | null;
          topic?: string | null;
          subtopic?: string | null;
          difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
          tags?: string[];
          status?: 'active' | 'draft' | 'archived' | 'deprecated';
          reviewed_by?: string | null;
          updated_at?: string;
        };
      };
      content_uploads: {
        Row: {
          id: string;
          upload_type: 'course_structure' | 'questions' | 'videos' | 'resources';
          file_name: string;
          file_format: 'csv' | 'json' | 'xlsx' | 'yaml';
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
          total_items: number;
          processed_items: number;
          failed_items: number;
          error_log: Json;
          created_records: Json;
          target_course_id: string | null;
          target_module_id: string | null;
          uploaded_by: string;
          uploaded_at: string;
          processed_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          upload_type: 'course_structure' | 'questions' | 'videos' | 'resources';
          file_name: string;
          file_format: 'csv' | 'json' | 'xlsx' | 'yaml';
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
          total_items?: number;
          processed_items?: number;
          failed_items?: number;
          error_log?: Json;
          created_records?: Json;
          target_course_id?: string | null;
          target_module_id?: string | null;
          uploaded_by: string;
          uploaded_at?: string;
          processed_at?: string | null;
          metadata?: Json;
        };
        Update: {
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
          processed_items?: number;
          failed_items?: number;
          error_log?: Json;
          created_records?: Json;
          processed_at?: string | null;
        };
      };
      delivery_managers: {
        Row: {
          id: string;
          user_id: string;
          can_upload_courses: boolean;
          can_upload_questions: boolean;
          can_upload_media: boolean;
          can_manage_all_courses: boolean;
          assigned_course_codes: string[];
          total_uploads: number;
          last_upload_at: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          can_upload_courses?: boolean;
          can_upload_questions?: boolean;
          can_upload_media?: boolean;
          can_manage_all_courses?: boolean;
          assigned_course_codes?: string[];
          total_uploads?: number;
          last_upload_at?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          can_upload_courses?: boolean;
          can_upload_questions?: boolean;
          can_upload_media?: boolean;
          can_manage_all_courses?: boolean;
          assigned_course_codes?: string[];
          total_uploads?: number;
          last_upload_at?: string | null;
          status?: 'active' | 'inactive';
          updated_at?: string;
        };
      };
      external_resources: {
        Row: {
          id: string;
          title: string;
          description: string;
          resource_type: 'link' | 'pdf' | 'video' | 'tool' | 'documentation';
          url: string;
          course_id: string | null;
          module_id: string | null;
          lesson_id: string | null;
          icon: string | null;
          sort_order: number;
          is_featured: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          resource_type?: 'link' | 'pdf' | 'video' | 'tool' | 'documentation';
          url: string;
          course_id?: string | null;
          module_id?: string | null;
          lesson_id?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_featured?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          resource_type?: 'link' | 'pdf' | 'video' | 'tool' | 'documentation';
          url?: string;
          icon?: string | null;
          sort_order?: number;
          is_featured?: boolean;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Convenience type aliases
export type Company = Tables<'companies'>;
export type User = Tables<'users'>;
export type Course = Tables<'courses'>;
export type Module = Tables<'modules'>;
export type Lesson = Tables<'lessons'>;
export type Quiz = Tables<'quizzes'>;
export type Question = Tables<'questions'>;
export type Enrollment = Tables<'enrollments'>;
export type LessonProgress = Tables<'lesson_progress'>;
export type QuizAttempt = Tables<'quiz_attempts'>;
export type GamificationProfile = Tables<'gamification_profiles'>;
export type Achievement = Tables<'achievements'>;
export type UserAchievement = Tables<'user_achievements'>;
export type AuditLog = Tables<'audit_logs'>;
export type PortalAccess = Tables<'portal_access'>;

// V2 Optimized Tables (External Media & Delivery Manager)
export type MediaReference = Tables<'media_references'>;
export type QuestionBank = Tables<'question_bank'>;
export type ContentUpload = Tables<'content_uploads'>;
export type DeliveryManager = Tables<'delivery_managers'>;
export type ExternalResource = Tables<'external_resources'>;
