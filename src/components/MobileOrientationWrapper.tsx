import React, { useEffect } from 'react';
import { useOrientation } from '@/hooks/use-orientation';
import { useDeviceFeatures } from '@/hooks/use-device-features';
import { cn } from '@/lib/utils';

interface MobileOrientationWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileOrientationWrapper({ children, className }: MobileOrientationWrapperProps) {
  const { orientation, isLandscape } = useOrientation();
  const { isNative } = useDeviceFeatures();

  // Force viewport recalculation on orientation change
  useEffect(() => {
    if (isNative) {
      const handleOrientationChange = () => {
        // Force a reflow to fix viewport issues
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
        }, 100);
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      return () => window.removeEventListener('orientationchange', handleOrientationChange);
    }
  }, [isNative]);

  return (
    <div 
      className={cn(
        "w-full",
        isNative && isLandscape && "mobile-landscape-container ios-viewport-fix android-landscape-fix",
        isNative && !isLandscape && "mobile-portrait-optimized",
        className
      )}
      data-orientation={orientation}
    >
      {children}
    </div>
  );
}