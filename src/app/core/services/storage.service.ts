import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  /**
   * حفظ عنصر في التخزين المحلي
   */
  setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`خطأ في حفظ ${key}:`, error);
    }
  }

  /**
   * الحصول على عنصر من التخزين المحلي
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`خطأ في قراءة ${key}:`, error);
      return null;
    }
  }

  /**
   * حذف عنصر من التخزين المحلي
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`خطأ في حذف ${key}:`, error);
    }
  }

  /**
   * مسح جميع البيانات المحفوظة
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('خطأ في مسح التخزين:', error);
    }
  }

  /**
   * التحقق من وجود عنصر
   */
  hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * الحصول على جميع المفاتيح
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        keys.push(key);
      }
    }
    return keys;
  }
}
