import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en';

const translations = {
  es: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      properties: 'Propiedades',
      tenants: 'Inquilinos',
      payments: 'Pagos',
      maintenance: 'Mantenimiento',
      inviteTenant: 'Invitar Inquilino',
      accounting: 'Contabilidad',
      assistant: 'Asistente IA',
      analytics: 'Análisis',
      reports: 'Reportes',
      settings: 'Configuración',
      myUnit: 'Mi Unidad',
      myPayments: 'Mis Pagos',
    },
    // Sidebar
    sidebar: {
      greeting: 'Bienvenido',
      subtitle: 'Gestor de propiedades',
      website: 'Ir al Sitio Web',
      signOut: 'Cerrar Sesión',
      tenantLabel: 'Inquilino',
      landlordLabel: 'Propietario',
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      addTenant: 'Agregar Inquilino',
      addProperty: 'Agregar Propiedad',
      importData: 'Importar Datos',
    },
    // Settings
    settings: {
      title: 'Configuración',
      account: 'Cuenta',
      theme: 'Tema',
      language: 'Idioma',
      data: 'Datos',
      stripe: 'Stripe',
    },
    // Language settings
    languageSettings: {
      title: 'Configuración de Idioma',
      description: 'Elige tu idioma preferido para la aplicación',
      label: 'Idioma de la Aplicación',
      placeholder: 'Seleccionar idioma',
      spanish: '🇪🇸 Español',
      english: '🇺🇸 English',
      dateFormatLabel: 'Formato de Fecha',
      dateFormatPlaceholder: 'Seleccionar formato',
      saved: 'Idioma guardado: Español',
    },
    // Common
    common: {
      loading: 'Cargando...',
      error: 'Error',
      save: 'Guardar',
      cancel: 'Cancelar',
      edit: 'Editar',
      delete: 'Eliminar',
      add: 'Agregar',
      close: 'Cerrar',
      back: 'Volver',
      confirm: 'Confirmar',
      yes: 'Sí',
      no: 'No',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
    },
    // Auth
    auth: {
      signIn: 'Iniciar Sesión',
      signUp: 'Registrarse',
      signOut: 'Cerrar Sesión',
      email: 'Correo Electrónico',
      password: 'Contraseña',
      forgotPassword: '¿Olvidaste tu contraseña?',
      resetPassword: 'Restablecer Contraseña',
    },
    // Tenants
    tenants: {
      title: 'Inquilinos',
      add: 'Agregar Inquilino',
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      unit: 'Unidad',
      rent: 'Renta',
      status: 'Estado',
      active: 'Activo',
      inactive: 'Inactivo',
    },
    // Payments
    payments: {
      title: 'Pagos',
      pending: 'Pendientes',
      paid: 'Pagados',
      overdue: 'Vencidos',
      amount: 'Monto',
      date: 'Fecha',
      markPaid: 'Marcar como Pagado',
    },
    // Properties
    properties: {
      title: 'Propiedades',
      add: 'Agregar Propiedad',
      name: 'Nombre',
      address: 'Dirección',
      units: 'Unidades',
      occupancy: 'Ocupación',
    },
  },
  en: {
    // Navigation
    nav: {
      dashboard: 'Dashboard',
      properties: 'Properties',
      tenants: 'Tenants',
      payments: 'Payments',
      maintenance: 'Maintenance',
      inviteTenant: 'Invite Tenant',
      accounting: 'Accounting',
      assistant: 'AI Assistant',
      analytics: 'Analytics',
      reports: 'Reports',
      settings: 'Settings',
      myUnit: 'My Unit',
      myPayments: 'My Payments',
    },
    // Sidebar
    sidebar: {
      greeting: 'Welcome',
      subtitle: 'Property manager',
      website: 'Go to Website',
      signOut: 'Sign Out',
      tenantLabel: 'Tenant',
      landlordLabel: 'Landlord',
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      addTenant: 'Add Tenant',
      addProperty: 'Add Property',
      importData: 'Import Data',
    },
    // Settings
    settings: {
      title: 'Settings',
      account: 'Account',
      theme: 'Theme',
      language: 'Language',
      data: 'Data',
      stripe: 'Stripe',
    },
    // Language settings
    languageSettings: {
      title: 'Language Settings',
      description: 'Choose your preferred language for the application',
      label: 'Application Language',
      placeholder: 'Select language',
      spanish: '🇪🇸 Español',
      english: '🇺🇸 English',
      dateFormatLabel: 'Date Format',
      dateFormatPlaceholder: 'Select format',
      saved: 'Language saved: English',
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      close: 'Close',
      back: 'Back',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
    },
    // Auth
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      forgotPassword: 'Forgot your password?',
      resetPassword: 'Reset Password',
    },
    // Tenants
    tenants: {
      title: 'Tenants',
      add: 'Add Tenant',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      unit: 'Unit',
      rent: 'Rent',
      status: 'Status',
      active: 'Active',
      inactive: 'Inactive',
    },
    // Payments
    payments: {
      title: 'Payments',
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
      amount: 'Amount',
      date: 'Date',
      markPaid: 'Mark as Paid',
    },
    // Properties
    properties: {
      title: 'Properties',
      add: 'Add Property',
      name: 'Name',
      address: 'Address',
      units: 'Units',
      occupancy: 'Occupancy',
    },
  },
} as const;

export type Translations = typeof translations.es;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('rentaflux_language');
    return (saved === 'en' || saved === 'es') ? saved : 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('rentaflux_language', lang);
    // Update the html lang attribute for accessibility & SEO
    document.documentElement.lang = lang;
  };

  // Sync html lang on mount
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value: I18nContextType = {
    language,
    setLanguage,
    t: translations[language] as Translations,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
