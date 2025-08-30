// ===================================================================
// src/app/shared/pipes/arabic-date.pipe.ts
// ===================================================================

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'arabicDate',
  standalone: true
})
export class ArabicDatePipe implements PipeTransform {

  private arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  private arabicDays = [
    'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء',
    'الخميس', 'الجمعة', 'السبت'
  ];

  transform(value: string | Date | null | undefined,
    format: 'short' | 'medium' | 'long' | 'full' = 'medium',
    includeTime: boolean = false): string {

    if (!value) {
      return '';
    }

    const date = typeof value === 'string' ? new Date(value) : value;

    if (isNaN(date.getTime())) {
      return '';
    }

    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const dayName = this.arabicDays[date.getDay()];
    const monthName = this.arabicMonths[month];

    let result = '';

    switch (format) {
      case 'short':
        // DD/MM/YYYY
        result = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;
        break;

      case 'medium':
        // DD monthName YYYY
        result = `${day} ${monthName} ${year}`;
        break;

      case 'long':
        // dayName، DD monthName YYYY
        result = `${dayName}، ${day} ${monthName} ${year}`;
        break;

      case 'full':
        // dayName، DD monthName YYYY - with relative time
        result = `${dayName}، ${day} ${monthName} ${year}`;
        const relative = this.getRelativeTime(date);
        if (relative) {
          result += ` (${relative})`;
        }
        break;
    }

    if (includeTime) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'م' : 'ص';
      const displayHours = hours % 12 || 12;
      const timeString = `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
      result += ` - ${timeString}`;
    }

    return result;
  }

  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'اليوم';
    } else if (diffDays === 1) {
      return 'أمس';
    } else if (diffDays === -1) {
      return 'غداً';
    } else if (diffDays > 1 && diffDays <= 7) {
      return `منذ ${diffDays} أيام`;
    } else if (diffDays < -1 && diffDays >= -7) {
      return `بعد ${Math.abs(diffDays)} أيام`;
    }

    return '';
  }
}
