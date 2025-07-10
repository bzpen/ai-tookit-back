export class DateUtil {
  /**
   * 格式化日期为字符串
   */
  static formatDate(date: Date, format: string = 'YYYY-MM-DD HH:mm:ss'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second);
  }

  /**
   * 解析日期字符串
   */
  static parseDate(dateString: string): Date | null {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * 获取当前时间戳
   */
  static now(): number {
    return Date.now();
  }

  /**
   * 获取当前日期
   */
  static getCurrentDate(): Date {
    return new Date();
  }

  /**
   * 获取今天的开始时间
   */
  static getStartOfDay(date: Date = new Date()): Date {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }

  /**
   * 获取今天的结束时间
   */
  static getEndOfDay(date: Date = new Date()): Date {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }

  /**
   * 添加天数
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * 添加小时
   */
  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * 添加分钟
   */
  static addMinutes(date: Date, minutes: number): Date {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  }

  /**
   * 添加秒数
   */
  static addSeconds(date: Date, seconds: number): Date {
    const result = new Date(date);
    result.setSeconds(result.getSeconds() + seconds);
    return result;
  }

  /**
   * 添加毫秒
   */
  static addMilliseconds(date: Date, milliseconds: number): Date {
    const result = new Date(date);
    result.setMilliseconds(result.getMilliseconds() + milliseconds);
    return result;
  }

  /**
   * 计算两个日期之间的天数差
   */
  static getDaysBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * 计算两个日期之间的小时差
   */
  static getHoursBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600));
  }

  /**
   * 计算两个日期之间的分钟差
   */
  static getMinutesBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 60));
  }

  /**
   * 计算两个日期之间的秒数差
   */
  static getSecondsBetween(startDate: Date, endDate: Date): number {
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / 1000);
  }

  /**
   * 检查日期是否为今天
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /**
   * 检查日期是否为昨天
   */
  static isYesterday(date: Date): boolean {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }

  /**
   * 检查日期是否为明天
   */
  static isTomorrow(date: Date): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }

  /**
   * 检查日期是否为周末
   */
  static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = 周日, 6 = 周六
  }

  /**
   * 检查日期是否为工作日
   */
  static isWeekday(date: Date): boolean {
    return !this.isWeekend(date);
  }

  /**
   * 检查是否为闰年
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * 获取月份的天数
   */
  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  /**
   * 获取月份的第一天
   */
  static getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * 获取月份的最后一天
   */
  static getLastDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * 获取年份的第一天
   */
  static getFirstDayOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1);
  }

  /**
   * 获取年份的最后一天
   */
  static getLastDayOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 11, 31);
  }

  /**
   * 获取星期几（中文）
   */
  static getWeekdayName(date: Date): string {
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekdays[date.getDay()] || '未知';
  }

  /**
   * 获取月份名称（中文）
   */
  static getMonthName(date: Date): string {
    const months = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    return months[date.getMonth()] || '未知';
  }

  /**
   * 获取相对时间描述
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    
    if (seconds < 60) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else if (weeks < 4) {
      return `${weeks}周前`;
    } else if (months < 12) {
      return `${months}个月前`;
    } else {
      return `${years}年前`;
    }
  }

  /**
   * 格式化时间段
   */
  static formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}天${hours % 24}小时${minutes % 60}分钟`;
    } else if (hours > 0) {
      return `${hours}小时${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  }

  /**
   * 获取时区偏移量
   */
  static getTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
  }

  /**
   * 转换为 UTC 时间
   */
  static toUTC(date: Date): Date {
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  }

  /**
   * 从 UTC 时间转换为本地时间
   */
  static fromUTC(date: Date): Date {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  }

  /**
   * 检查日期是否有效
   */
  static isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * 比较两个日期
   */
  static compareDates(date1: Date, date2: Date): number {
    return date1.getTime() - date2.getTime();
  }

  /**
   * 检查第一个日期是否早于第二个日期
   */
  static isBefore(date1: Date, date2: Date): boolean {
    return date1.getTime() < date2.getTime();
  }

  /**
   * 检查第一个日期是否晚于第二个日期
   */
  static isAfter(date1: Date, date2: Date): boolean {
    return date1.getTime() > date2.getTime();
  }

  /**
   * 检查两个日期是否相等
   */
  static isEqual(date1: Date, date2: Date): boolean {
    return date1.getTime() === date2.getTime();
  }

  /**
   * 检查日期是否在指定范围内
   */
  static isInRange(date: Date, startDate: Date, endDate: Date): boolean {
    return date.getTime() >= startDate.getTime() && date.getTime() <= endDate.getTime();
  }

  /**
   * 获取两个日期之间的所有日期
   */
  static getDatesBetween(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }

  /**
   * 生成 ISO 8601 格式的日期字符串
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * 从 ISO 8601 格式的字符串解析日期
   */
  static fromISOString(isoString: string): Date | null {
    try {
      const date = new Date(isoString);
      return this.isValidDate(date) ? date : null;
    } catch {
      return null;
    }
  }

  /**
   * 获取 Unix 时间戳
   */
  static getUnixTimestamp(date: Date = new Date()): number {
    return Math.floor(date.getTime() / 1000);
  }

  /**
   * 从 Unix 时间戳创建日期
   */
  static fromUnixTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
  }

  /**
   * 获取季度
   */
  static getQuarter(date: Date): number {
    return Math.floor(date.getMonth() / 3) + 1;
  }

  /**
   * 获取年龄
   */
  static getAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * 检查是否为生日
   */
  static isBirthday(birthDate: Date, checkDate: Date = new Date()): boolean {
    return birthDate.getMonth() === checkDate.getMonth() && 
           birthDate.getDate() === checkDate.getDate();
  }

  /**
   * 获取下一个生日
   */
  static getNextBirthday(birthDate: Date): Date {
    const today = new Date();
    const thisYear = today.getFullYear();
    const nextBirthday = new Date(thisYear, birthDate.getMonth(), birthDate.getDate());
    
    if (nextBirthday <= today) {
      nextBirthday.setFullYear(thisYear + 1);
    }
    
    return nextBirthday;
  }

  /**
   * 获取距离下一个生日的天数
   */
  static getDaysUntilBirthday(birthDate: Date): number {
    const nextBirthday = this.getNextBirthday(birthDate);
    return this.getDaysBetween(new Date(), nextBirthday);
  }

  /**
   * 创建日期范围
   */
  static createDateRange(start: Date, end: Date): { start: Date; end: Date } {
    return {
      start: new Date(start),
      end: new Date(end)
    };
  }

  /**
   * 检查日期范围是否重叠
   */
  static isDateRangeOverlap(
    range1: { start: Date; end: Date },
    range2: { start: Date; end: Date }
  ): boolean {
    return range1.start <= range2.end && range2.start <= range1.end;
  }

  /**
   * 获取日期范围的交集
   */
  static getDateRangeIntersection(
    range1: { start: Date; end: Date },
    range2: { start: Date; end: Date }
  ): { start: Date; end: Date } | null {
    const start = new Date(Math.max(range1.start.getTime(), range2.start.getTime()));
    const end = new Date(Math.min(range1.end.getTime(), range2.end.getTime()));
    
    return start <= end ? { start, end } : null;
  }

  /**
   * 获取本周的开始日期（周一）
   */
  static getStartOfWeek(date: Date = new Date()): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  /**
   * 获取本周的结束日期（周日）
   */
  static getEndOfWeek(date: Date = new Date()): Date {
    const startOfWeek = this.getStartOfWeek(date);
    return this.addDays(startOfWeek, 6);
  }

  /**
   * 获取本月的开始日期
   */
  static getStartOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * 获取本月的结束日期
   */
  static getEndOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }

  /**
   * 获取本年的开始日期
   */
  static getStartOfYear(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), 0, 1);
  }

  /**
   * 获取本年的结束日期
   */
  static getEndOfYear(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), 11, 31);
  }
} 