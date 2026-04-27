import { DateTime } from 'luxon'; // Librería recomendada para manejo robusto de fechas en Node

export class DateHelper {
  /**
   * Obtiene el rango de fechas para el inicio y fin de un mes específico.
   */
  static getMonthRange(year: number, month: number) {
    const start = DateTime.local(year, month, 1).startOf('day');
    const end = start.endOf('month').endOf('day');
    return { start: start.toJSDate(), end: end.toJSDate() };
  }

  /**
   * Obtiene los últimos N días desde hoy.
   */
  static getLastNDays(n: number) {
    const end = DateTime.local().endOf('day').toJSDate();
    const start = DateTime.local().minus({ days: n }).startOf('day').toJSDate();
    return { start, end };
  }

  /**
   * Formatea una fecha de JS a formato compatible con PostgreSQL (YYYY-MM-DD)
   */
  static toPostgresDate(date: Date): string {
    return DateTime.fromJSDate(date).toFormat('yyyy-MM-dd');
  }
}