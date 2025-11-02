import { useEffect } from 'react';

/**
 * COMPONENTE DE SEGURIDAD NUCLEAR - ELIMINA TODO
 */
export function DebugCleaner() {
  // DESHABILITADO TEMPORALMENTE - CAUSABA ERRORES DE DOM Y PANTALLAS EN BLANCO
  return null;
  
  useEffect(() => {
    let isActive = false;

    // FUNCIÓN NUCLEAR DE LIMPIEZA
    const nuclearClean = () => {
      if (!isActive) return;

      try {
        // ELIMINAR TODO EL CONTENIDO QUE CONTENGA INFORMACIÓN SENSIBLE
        const sensitivePatterns = [
          'Debug',
          'Storage Key',
          'payment_records_',
          'Has Records',
          'Total Records',
          'Current Month',
          'Sample Records',
          'tenantId',
          '18eaaefa',
          'Revenue Calculation'
        ];

        // BUSCAR Y DESTRUIR TODOS LOS ELEMENTOS
        document.querySelectorAll('*').forEach(element => {
          const text = element.textContent || '';
          const html = element.innerHTML || '';
          
          // Si contiene CUALQUIER patrón sensible, ELIMINARLO
          if (sensitivePatterns.some(pattern => 
            text.toLowerCase().includes(pattern.toLowerCase()) || 
            html.toLowerCase().includes(pattern.toLowerCase())
          )) {
            // Si es pequeño y contiene debug, ELIMINAR COMPLETAMENTE
            if (text.length < 5000 && (
              text.includes('Debug') || 
              text.includes('Storage Key') || 
              text.includes('payment_records_')
            )) {
              try {
                element.remove();
                console.warn('🔥 NUCLEAR: Eliminated debug element');
              } catch (e) {
                // Si no se puede eliminar, limpiar contenido
                element.innerHTML = '';
                element.textContent = '';
              }
            }
          }
        });

        // LIMPIAR TODOS LOS NODOS DE TEXTO
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT
        );

        const nodesToDestroy: Node[] = [];
        let node;
        while (node = walker.nextNode()) {
          const text = node.textContent || '';
          if (sensitivePatterns.some(pattern => 
            text.toLowerCase().includes(pattern.toLowerCase())
          )) {
            nodesToDestroy.push(node);
          }
        }

        nodesToDestroy.forEach(node => {
          try {
            if (node.parentElement) {
              node.parentElement.remove();
            } else {
              node.remove();
            }
          } catch (e) {
            // Ignorar errores
          }
        });

        // INTERCEPTAR Y BLOQUEAR CONSOLE.LOG
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
          const message = args.join(' ');
          if (sensitivePatterns.some(pattern => 
            message.toLowerCase().includes(pattern.toLowerCase())
          )) {
            return; // BLOQUEAR COMPLETAMENTE
          }
          originalLog.apply(console, args);
        };

        console.warn = (...args) => {
          const message = args.join(' ');
          if (sensitivePatterns.some(pattern => 
            message.toLowerCase().includes(pattern.toLowerCase())
          )) {
            return; // BLOQUEAR COMPLETAMENTE
          }
          originalWarn.apply(console, args);
        };

        console.error = (...args) => {
          const message = args.join(' ');
          if (sensitivePatterns.some(pattern => 
            message.toLowerCase().includes(pattern.toLowerCase())
          )) {
            return; // BLOQUEAR COMPLETAMENTE
          }
          originalError.apply(console, args);
        };

      } catch (error) {
        // Ignorar errores de limpieza
      }
    };

    // EJECUTAR LIMPIEZA NUCLEAR INMEDIATAMENTE
    nuclearClean();

    // EJECUTAR CADA 50ms (ULTRA AGRESIVO)
    const nuclearInterval = setInterval(nuclearClean, 50);

    // OBSERVER ULTRA AGRESIVO
    const nuclearObserver = new MutationObserver(() => {
      setTimeout(nuclearClean, 1);
    });

    nuclearObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeOldValue: true,
      characterDataOldValue: true
    });

    // LIMPIAR AL DESMONTAR
    return () => {
      isActive = false;
      clearInterval(nuclearInterval);
      nuclearObserver.disconnect();
    };
  }, []);

  // RENDERIZAR ELEMENTO DE CONTROL
  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 999999,
        display: 'none'
      }}
      data-nuclear-cleaner="active"
    />
  );
}
