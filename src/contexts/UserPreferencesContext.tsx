import React, { createContext, useContext, useState, useEffect } from 'react';

export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

interface UserPreferences {
  dateFormat: DateFormat;
  setDateFormat: (format: DateFormat) => void;
  formatDate: (date: string | Date) => string;
  parseDate: (dateString: string) => Date | null;
}

const UserPreferencesContext = createContext<UserPreferences | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [dateFormat, setDateFormatState] = useState<DateFormat>('DD/MM/YYYY');

  // Cargar preferencias del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('rentaflux_date_format');
    if (saved && (saved === 'DD/MM/YYYY' || saved === 'MM/DD/YYYY' || saved === 'YYYY-MM-DD')) {
      setDateFormatState(saved as DateFormat);
    }
  }, []);

  const setDateFormat = (format: DateFormat) => {
    setDateFormatState(format);
    localStorage.setItem('rentaflux_date_format', format);
  };

  const formatDate = (date: string | Date): string => {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      default:
        return `${day}/${month}/${year}`;
    }
  };

  const parseDate = (dateString: string): Date | null => {
    if (!dateString) return null;

    let day: number, month: number, year: number;

    switch (dateFormat) {
      case 'DD/MM/YYYY': {
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        day = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        year = parseInt(parts[2]);
        break;
      }
      case 'MM/DD/YYYY': {
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;
        month = parseInt(parts[0]) - 1;
        day = parseInt(parts[1]);
        year = parseInt(parts[2]);
        break;
      }
      case 'YYYY-MM-DD': {
        const parts = dateString.split('-');
        if (parts.length !== 3) return null;
        year = parseInt(parts[0]);
        month = parseInt(parts[1]) - 1;
        day = parseInt(parts[2]);
        break;
      }
      default:
        return null;
    }

    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  };

  return (
    <UserPreferencesContext.Provider value={{ dateFormat, setDateFormat, formatDate, parseDate }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within UserPreferencesProvider');
  }
  return context;
}
