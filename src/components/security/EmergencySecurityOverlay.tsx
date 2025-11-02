import { useEffect, useState } from 'react';

/**
 * COMPONENTE DE EMERGENCIA - SE SUPERPONE A TODO Y ELIMINA INFORMACIÓN SENSIBLE
 */
export function EmergencySecurityOverlay() {
  // DESHABILITADO TEMPORALMENTE - CAUSABA ERRORES DE DOM
  return null;
  
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    let cleanupCount = 0;

    const emergencyCleanup = () => {
      try {
        // PATRONES EXACTOS DEL PROBLEMA
        const dangerousPatterns = [
          'Debug: Revenue Calculation',
          'Storage Key: payment_records_',
          'Has Records: ✅',
          'Total Records:',
          'Current Month Paid:',
          'Current Month Revenue:',
          'Sample Records:',
          '18eaaefa-169b-4d7d-978f-7dcde085def3',
          'payment_records_18eaaefa'
        ];

        // BUSCAR Y DESTRUIR
        let elementsDestroyed = 0;
        
        document.querySelectorAll('*').forEach(element => {
          const text = element.textContent || '';
          
          // Si contiene EXACTAMENTE el patrón problemático
          if (dangerousPatterns.some(pattern => text.includes(pattern))) {
            try {
              // ELIMINAR INMEDIATAMENTE
              element.remove();
              elementsDestroyed++;
            } catch (e) {
              // Si no se puede eliminar, ocultar
              (element as HTMLElement).style.display = 'none';
              (element as HTMLElement).style.visibility = 'hidden';
              (element as HTMLElement).style.opacity = '0';
            }
          }
        });

        if (elementsDestroyed > 0) {
          cleanupCount += elementsDestroyed;
          console.warn(`🚨 EMERGENCY: Destroyed ${elementsDestroyed} dangerous elements (total: ${cleanupCount})`);
        }

        // LIMPIAR TAMBIÉN EL BODY DIRECTAMENTE
        if (document.body.innerHTML.includes('Debug: Revenue Calculation')) {
          dangerousPatterns.forEach(pattern => {
            document.body.innerHTML = document.body.innerHTML.replace(
              new RegExp(pattern, 'g'), 
              '[SECURITY BLOCKED]'
            );
          });
        }

      } catch (error) {
        console.error('Emergency cleanup error:', error);
      }
    };

    // EJECUTAR INMEDIATAMENTE
    emergencyCleanup();

    // EJECUTAR CADA 10ms (ULTRA ULTRA AGRESIVO)
    const emergencyInterval = setInterval(emergencyCleanup, 10);

    // OBSERVER DE EMERGENCIA
    const emergencyObserver = new MutationObserver(() => {
      emergencyCleanup();
    });

    emergencyObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // TIMEOUT PARA DESACTIVAR DESPUÉS DE 30 SEGUNDOS
    const timeout = setTimeout(() => {
      setIsActive(false);
      clearInterval(emergencyInterval);
      emergencyObserver.disconnect();
      console.log('🔒 Emergency security overlay deactivated after 30s');
    }, 30000);

    return () => {
      clearInterval(emergencyInterval);
      emergencyObserver.disconnect();
      clearTimeout(timeout);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999999,
        background: 'transparent'
      }}
      data-emergency-security="active"
    >
      {/* Overlay invisible que bloquea contenido sensible */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'transparent'
        }}
      />
    </div>
  );
}