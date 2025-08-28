// ===================================================================
// src/app/core/models/clinic.model.ts - نموذج العيادة
// ===================================================================
export interface Clinic {
  id: number;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlan = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export interface ClinicService {
  id: number;
  serviceName: string;
  description?: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
}

export interface CreateClinicRequest {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: string;
  subscriptionPlan?: SubscriptionPlan;
}
