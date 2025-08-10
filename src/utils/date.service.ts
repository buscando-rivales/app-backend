import { Injectable } from '@nestjs/common';

@Injectable()
export class DateService {
  /**
   * Calcula la edad basada en la fecha de nacimiento
   * @param birthDate Fecha de nacimiento
   * @returns Edad en años o null si la fecha es inválida
   */
  calculateAge(birthDate: Date | string | null): number | null {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);

    // Verificar que la fecha sea válida
    if (isNaN(birth.getTime())) return null;

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Si aún no ha cumplido años este año, restar 1
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  }

  /**
   * Formatea una fecha en formato ISO (YYYY-MM-DD)
   * @param date Fecha a formatear
   * @returns String en formato ISO o null
   */
  formatDateToISO(date: Date | string | null): string | null {
    if (!date) return null;

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;

    return dateObj.toISOString().split('T')[0];
  }

  /**
   * Valida si una fecha es válida
   * @param date Fecha a validar
   * @returns true si es válida, false si no
   */
  isValidDate(date: Date | string | null): boolean {
    if (!date) return false;
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }

  /**
   * Calcula la diferencia en días entre dos fechas
   * @param date1 Primera fecha
   * @param date2 Segunda fecha
   * @returns Diferencia en días
   */
  daysDifference(date1: Date | string, date2: Date | string): number | null {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;

    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
