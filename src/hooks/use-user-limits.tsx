import { useAuth } from '@/contexts/AuthContext';

export interface UserLimits {
  maxProperties: number;
  maxUnitsPerProperty: number;
  canAddTenants: boolean;
  canAddProperties: boolean;
  isUnlimited: boolean;
}

export function useUserLimits(): UserLimits {
  const { userRole, isPremium } = useAuth();

  if (userRole === 'landlord_premium' || isPremium) {
    return {
      maxProperties: Infinity,
      maxUnitsPerProperty: Infinity,
      canAddTenants: true,
      canAddProperties: true,
      isUnlimited: true,
    };
  }

  // Free user limits - Solo 1 propiedad, 3 unidades
  return {
    maxProperties: 1,
    maxUnitsPerProperty: 3,
    canAddTenants: true,
    canAddProperties: true,
    isUnlimited: false,
  };
}