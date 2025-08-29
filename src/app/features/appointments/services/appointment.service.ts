// ===================================================================
// 3. APPOINTMENT SERVICE
// src/app/features/appointments/services/appointment.service.ts
// ===================================================================
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, tap } from 'rxjs';
import {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  AppointmentSearchCriteria,
  TimeSlot,
  DoctorSchedule,
  AppointmentStatus,
  AppointmentType
} from '../models/appointment.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/appointments`;

  // Signals for state management
  appointments = signal<Appointment[]>([]);
  selectedAppointment = signal<Appointment | null>(null);
  loading = signal(false);

  // Mock data for development
  private mockAppointments: Appointment[] = [
    {
      id: 1,
      patientId: 1,
      patientName: 'أحمد محمد علي',
      patientPhone: '0501234567',
      doctorId: 1,
      doctorName: 'د. سارة أحمد',
      appointmentDate: '2024-08-29',
      appointmentTime: '10:00',
      duration: 30,
      type: AppointmentType.CONSULTATION,
      status: AppointmentStatus.SCHEDULED,
      chiefComplaint: 'صداع مستمر',
      notes: 'المريض يعاني من صداع منذ أسبوع',
      createdAt: '2024-08-25T10:00:00Z',
      createdBy: 'admin'
    },
    {
      id: 2,
      patientId: 2,
      patientName: 'فاطمة عبدالله',
      patientPhone: '0509876543',
      doctorId: 1,
      doctorName: 'د. سارة أحمد',
      appointmentDate: '2024-08-29',
      appointmentTime: '10:30',
      duration: 30,
      type: AppointmentType.FOLLOW_UP,
      status: AppointmentStatus.CONFIRMED,
      chiefComplaint: 'متابعة ضغط الدم',
      createdAt: '2024-08-24T14:00:00Z',
      createdBy: 'receptionist'
    },
    {
      id: 3,
      patientId: 3,
      patientName: 'محمد سالم',
      patientPhone: '0555555555',
      doctorId: 2,
      doctorName: 'د. محمد خالد',
      appointmentDate: '2024-08-29',
      appointmentTime: '11:00',
      duration: 45,
      type: AppointmentType.ROUTINE_CHECK,
      status: AppointmentStatus.CHECKED_IN,
      chiefComplaint: 'فحص دوري',
      createdAt: '2024-08-23T09:00:00Z',
      createdBy: 'admin'
    }
  ];

  // Get all appointments with optional search criteria
  getAppointments(criteria?: AppointmentSearchCriteria): Observable<Appointment[]> {
    // Mock implementation
    return of(this.mockAppointments).pipe(
      delay(500),
      map(appointments => {
        let filtered = [...appointments];

        if (criteria) {
          if (criteria.patientId) {
            filtered = filtered.filter(a => a.patientId === criteria.patientId);
          }
          if (criteria.doctorId) {
            filtered = filtered.filter(a => a.doctorId === criteria.doctorId);
          }
          if (criteria.status) {
            filtered = filtered.filter(a => a.status === criteria.status);
          }
          if (criteria.type) {
            filtered = filtered.filter(a => a.type === criteria.type);
          }
          if (criteria.fromDate) {
            filtered = filtered.filter(a => a.appointmentDate >= criteria.fromDate!);
          }
          if (criteria.toDate) {
            filtered = filtered.filter(a => a.appointmentDate <= criteria.toDate!);
          }
          if (criteria.searchQuery) {
            const query = criteria.searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
              a.patientName?.toLowerCase().includes(query) ||
              a.doctorName?.toLowerCase().includes(query) ||
              a.chiefComplaint?.toLowerCase().includes(query)
            );
          }
        }

        return filtered;
      }),
      tap(appointments => this.appointments.set(appointments))
    );

    // Real implementation (commented for now)
    // let params = new HttpParams();
    // if (criteria) {
    //   Object.keys(criteria).forEach(key => {
    //     const value = (criteria as any)[key];
    //     if (value !== undefined && value !== null) {
    //       params = params.set(key, value.toString());
    //     }
    //   });
    // }
    // return this.http.get<Appointment[]>(this.apiUrl, { params })
    //   .pipe(tap(appointments => this.appointments.set(appointments)));
  }

  // Get appointment by ID
  getAppointmentById(id: number): Observable<Appointment> {
    // Mock implementation
    const appointment = this.mockAppointments.find(a => a.id === id);
    return of(appointment!).pipe(
      delay(300),
      tap(appointment => this.selectedAppointment.set(appointment))
    );

    // Real implementation
    // return this.http.get<Appointment>(`${this.apiUrl}/${id}`)
    //   .pipe(tap(appointment => this.selectedAppointment.set(appointment)));
  }

  // Create new appointment
  createAppointment(request: CreateAppointmentRequest): Observable<Appointment> {
    // Mock implementation
    const newAppointment: Appointment = {
      ...request,
      id: Math.floor(Math.random() * 10000),
      status: AppointmentStatus.SCHEDULED,
      createdAt: new Date().toISOString(),
      createdBy: 'current_user'
    };
    this.mockAppointments.push(newAppointment);
    return of(newAppointment).pipe(delay(500));

    // Real implementation
    // return this.http.post<Appointment>(this.apiUrl, request);
  }

  // Update appointment
  updateAppointment(id: number, request: UpdateAppointmentRequest): Observable<Appointment> {
    // Mock implementation
    const index = this.mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      this.mockAppointments[index] = {
        ...this.mockAppointments[index],
        ...request,
        updatedAt: new Date().toISOString()
      };
      return of(this.mockAppointments[index]).pipe(delay(500));
    }
    throw new Error('Appointment not found');

    // Real implementation
    // return this.http.put<Appointment>(`${this.apiUrl}/${id}`, request);
  }

  // Update appointment status
  updateAppointmentStatus(id: number, status: AppointmentStatus): Observable<Appointment> {
    // Mock implementation
    const index = this.mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      this.mockAppointments[index].status = status;
      this.mockAppointments[index].updatedAt = new Date().toISOString();
      return of(this.mockAppointments[index]).pipe(delay(300));
    }
    throw new Error('Appointment not found');

    // Real implementation
    // return this.http.patch<Appointment>(`${this.apiUrl}/${id}/status`, { status });
  }

  // Cancel appointment
  cancelAppointment(id: number, reason?: string): Observable<void> {
    // Mock implementation
    const index = this.mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      this.mockAppointments[index].status = AppointmentStatus.CANCELLED;
      if (reason) {
        this.mockAppointments[index].notes =
          `${this.mockAppointments[index].notes || ''}\nسبب الإلغاء: ${reason}`;
      }
      return of(void 0).pipe(delay(300));
    }
    throw new Error('Appointment not found');

    // Real implementation
    // return this.http.patch<void>(`${this.apiUrl}/${id}/cancel`, { reason });
  }

  // Reschedule appointment
  rescheduleAppointment(
    id: number,
    newDate: string,
    newTime: string
  ): Observable<Appointment> {
    // Mock implementation
    const index = this.mockAppointments.findIndex(a => a.id === id);
    if (index !== -1) {
      this.mockAppointments[index].appointmentDate = newDate;
      this.mockAppointments[index].appointmentTime = newTime;
      this.mockAppointments[index].status = AppointmentStatus.RESCHEDULED;
      this.mockAppointments[index].updatedAt = new Date().toISOString();
      return of(this.mockAppointments[index]).pipe(delay(500));
    }
    throw new Error('Appointment not found');

    // Real implementation
    // return this.http.patch<Appointment>(`${this.apiUrl}/${id}/reschedule`, {
    //   appointmentDate: newDate,
    //   appointmentTime: newTime
    // });
  }

  // Get available time slots for a doctor on a specific date
  getAvailableTimeSlots(doctorId: number, date: string): Observable<TimeSlot[]> {
    // Mock implementation
    const slots: TimeSlot[] = [];
    const startHour = 9;
    const endHour = 17;
    const slotDuration = 30; // minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Check if slot is already booked
        const isBooked = this.mockAppointments.some(a =>
          a.doctorId === doctorId &&
          a.appointmentDate === date &&
          a.appointmentTime === time &&
          a.status !== AppointmentStatus.CANCELLED
        );

        const bookedAppointment = isBooked ?
          this.mockAppointments.find(a =>
            a.doctorId === doctorId &&
            a.appointmentDate === date &&
            a.appointmentTime === time
          ) : undefined;

        slots.push({
          time,
          available: !isBooked,
          appointmentId: bookedAppointment?.id,
          patientName: bookedAppointment?.patientName
        });
      }
    }

    // Mark break time as unavailable (12:00 - 13:00)
    slots.forEach(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      if (hour === 12) {
        slot.available = false;
      }
    });

    return of(slots).pipe(delay(500));

    // Real implementation
    // return this.http.get<TimeSlot[]>(`${this.apiUrl}/slots`, {
    //   params: { doctorId: doctorId.toString(), date }
    // });
  }

  // Get doctor's schedule
  getDoctorSchedule(doctorId: number): Observable<DoctorSchedule> {
    // Mock implementation
    const schedule: DoctorSchedule = {
      doctorId,
      doctorName: 'د. سارة أحمد',
      availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      breakTime: {
        start: '12:00',
        end: '13:00'
      },
      slotDuration: 30
    };

    return of(schedule).pipe(delay(300));

    // Real implementation
    // return this.http.get<DoctorSchedule>(`${this.apiUrl}/doctors/${doctorId}/schedule`);
  }

  // Get today's appointments
  getTodayAppointments(doctorId?: number): Observable<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    const criteria: AppointmentSearchCriteria = {
      fromDate: today,
      toDate: today
    };

    if (doctorId) {
      criteria.doctorId = doctorId;
    }

    return this.getAppointments(criteria);
  }

  // Get upcoming appointments for a patient
  getPatientUpcomingAppointments(patientId: number): Observable<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.getAppointments({
      patientId,
      fromDate: today,
      status: AppointmentStatus.SCHEDULED
    });
  }

  // Check for appointment conflicts
  checkAppointmentConflict(
    doctorId: number,
    date: string,
    time: string,
    duration: number,
    excludeAppointmentId?: number
  ): Observable<boolean> {
    // Mock implementation
    const hasConflict = this.mockAppointments.some(appointment => {
      if (appointment.doctorId !== doctorId ||
          appointment.appointmentDate !== date ||
          appointment.status === AppointmentStatus.CANCELLED ||
          (excludeAppointmentId && appointment.id === excludeAppointmentId)) {
        return false;
      }

      const appointmentStart = this.timeToMinutes(appointment.appointmentTime);
      const appointmentEnd = appointmentStart + appointment.duration;
      const newStart = this.timeToMinutes(time);
      const newEnd = newStart + duration;

      return (newStart < appointmentEnd && newEnd > appointmentStart);
    });

    return of(hasConflict).pipe(delay(200));

    // Real implementation
    // return this.http.post<boolean>(`${this.apiUrl}/check-conflict`, {
    //   doctorId, date, time, duration, excludeAppointmentId
    // });
  }

  // Helper method to convert time string to minutes
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Send appointment reminder
  sendAppointmentReminder(appointmentId: number): Observable<void> {
    // Mock implementation
    console.log(`Sending reminder for appointment ${appointmentId}`);
    return of(void 0).pipe(delay(500));

    // Real implementation
    // return this.http.post<void>(`${this.apiUrl}/${appointmentId}/send-reminder`, {});
  }

  // Export appointments
  exportAppointments(
    criteria?: AppointmentSearchCriteria,
    format: 'excel' | 'pdf' = 'excel'
  ): Observable<Blob> {
    // Mock implementation
    const mockBlob = new Blob(['Mock appointment data'], {
      type: format === 'excel' ?
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
        'application/pdf'
    });
    return of(mockBlob).pipe(delay(1000));

    // Real implementation
    // let params = new HttpParams().set('format', format);
    // if (criteria) {
    //   Object.keys(criteria).forEach(key => {
    //     const value = (criteria as any)[key];
    //     if (value !== undefined && value !== null) {
    //       params = params.set(key, value.toString());
    //     }
    //   });
    // }
    // return this.http.get(`${this.apiUrl}/export`, {
    //   params,
    //   responseType: 'blob'
    // });
  }
}
