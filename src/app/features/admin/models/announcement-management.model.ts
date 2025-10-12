// ===================================================================
// src/app/features/admin/models/announcement-management.model.ts
// Announcement Management Models for SYSTEM_ADMIN
// ===================================================================

import {
  AnnouncementType,
  AnnouncementPriority,
  Announcement
} from '../../../public/models/announcement.model';

// ===================================================================
// Request DTOs
// ===================================================================

export interface CreateAnnouncementRequest {
  type: AnnouncementType;
  title: string;
  message: string;
  clinicId?: number;
  doctorId?: number;
  priority: AnnouncementPriority;
  startDate: string; // ISO date string
  endDate?: string; // ISO date string
  isActive: boolean;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
}

export interface UpdateAnnouncementRequest {
  type?: AnnouncementType;
  title?: string;
  message?: string;
  clinicId?: number;
  doctorId?: number;
  priority?: AnnouncementPriority;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  imageUrl?: string;
  actionUrl?: string;
  actionText?: string;
}

// ===================================================================
// Filter & Search
// ===================================================================

export interface AnnouncementFilter {
  type?: AnnouncementType;
  priority?: AnnouncementPriority;
  isActive?: boolean;
  clinicId?: number;
  searchTerm?: string;
}

// Re-export for convenience
export type { Announcement, AnnouncementType, AnnouncementPriority };
