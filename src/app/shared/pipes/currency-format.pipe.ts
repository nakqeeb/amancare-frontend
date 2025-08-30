// ===================================================================
// src/app/shared/pipes/currency-format.pipe.ts
// ===================================================================

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true
})
export class CurrencyFormatPipe implements PipeTransform {

  transform(value: number | string | null | undefined,
    currency: string = 'ر.س',
    decimals: number = 2,
    locale: string = 'ar-SA'): string {

    if (value === null || value === undefined) {
      return `0.00 ${currency}`;
    }

    // Convert string to number if needed
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return `0.00 ${currency}`;
    }

    // Format the number with locale
    const formatted = numValue.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    // Return with currency symbol
    return `${formatted} ${currency}`;
  }
}
