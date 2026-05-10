export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const getToday = (): string => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getNow = (): string => {
  return new Date().toISOString().slice(0, 19); // "YYYY-MM-DDTHH:MM:SS"
};

export const addDays = (dateString: string, days: number): string => {
  const [yyyy, mm, dd] = dateString.split('-').map(Number);
  const date = new Date(yyyy, mm - 1, dd);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const isToday = (dateString: string): boolean => {
  return dateString === getToday();
};

export const isPastOrToday = (dateString: string): boolean => {
  const today = getToday();
  return dateString <= today;
};

export const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const groupByDate = <T extends { dateAdded: string }>(
  items: T[]
): Record<string, T[]> => {
  return items.reduce((groups, item) => {
    const date = item.dateAdded;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
