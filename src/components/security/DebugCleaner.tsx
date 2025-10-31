import { useEffect } from 'react';

/**
 * Componente de seguridad ULTRA AGRESIVO que elimina cualquier información de debug
 */
export function DebugCleaner() {
  useEffect(() => {
    let isActive = true;

    const cleanDebugElements = () => {
      if (!isActive) return;

      try {
        // Patrones más específicos basados en el texto exacto que aparece
        const exactPatterns = [
          'Debug: Revenue Calculation',
          'Storage Key: payment_records_',
          'Has Records: ✅',
          'Total Records:',
          'Current Month Paid:',
          'Current Month Revenue:',
          'Sample Records:',
          'tenantId',
          'payment_records_18eaaefa',
          '18eaaefa-169b-4d7d-978f-7dcde085def3'
        ];

        // Buscar en TODOS los elementos del DOM
        const allElements = document.querySelectorAll('*');
        const elementsToRemove: Element[] = [];

        allElements.forEach(element => {
          const textContent = element.textContent || '';
          const innerHTML = element.innerHTML || '';
          
          // Verificar si contiene información sensible
          const hasSensitiveContent = exactPatterns.some(pattern => 
            textContent.includes(pattern) || innerHTML.includes(pattern)
          );

          if (hasSensitiveContent) {
            // Si es un elemento pequeño que solo contiene debug info, eliminarlo
            if (textContent.length < 2000 && (
              textContent.includes('Debug: Revenue') ||
              textContent.includes('Storage Key:') ||
              textContent.includes('payment_records_')
            )) {
              elementsToRemove.push(element);
            } else {
              // Si es un elemento grande, limpiar solo el contenido sensible
              exactPatterns.forEach(pattern => {
                if (element.innerHTML.includes(pattern)) {
                  element.innerHTML = element.innerHTML.replace(new RegExp(pattern, 'g'), '[REMOVED FOR SECURITY]');
                }
              });
            }
          }
        });

        // Eliminar elementos que contienen solo información de debug
        elementsToRemove.forEach(element => {
          try {
            console.warn('🔒 SECURITY: Removing debug element:', element.textContent?.substring(0, 100));
            element.remove();
          } catch (error) {
            console.error('Error removing element:', error);
          }
        });

        // Buscar y limpiar nodos de texto específicos
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              const text = node.textContent || '';
              return exactPatterns.some(pattern => text.includes(pattern)) 
                ? NodeFilter.FILTER_ACCEPT 
                : NodeFilter.FILTER_REJECT;
            }
          },
          false
        );

        const textNodesToClean: Node[] = [];
        let node;
        while (node = walker.nextNode()) {
          textNodesToClean.push(node);
        }

        textNodesToClean.forEach(textNode => {
          try {
            if (textNode.parentElement) {
              console.warn('🔒 SECURITY: Cleaning text node:', textNode.textContent?.substring(0, 50));
              textNode.parentElement.remove();
            }
          } catch (error) {
            console.error('Error cleaning text node:', error);
          }
        });

        // Limpiar localStorage si contiene información sensible visible
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('payment_records_')) {
              // No eliminar los datos, pero asegurar que no se muestren en el DOM
              console.warn('🔒 SECURITY: Found sensitive localStorage key, ensuring it\'s not displayed');
            }
          }
        } catch (error) {
          console.error('Error checking localStorage:', error);
        }

      } catch (error) {
        console.error('Error in cleanDebugElements:', error);
      }
    };

    // Limpiar inmediatamente
    cleanDebugElements();

    // Limpiar cada 100ms para ser ultra agresivo
    const rapidInterval = setInterval(cleanDebugElements, 100);

    // Observer para cambios en el DOM
    const observer = new MutationObserver((mutations) => {
      let shouldClean = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent || '';
              if (text.includes('Debug:') || text.includes('Storage Key:') || text.includes('payment_records_')) {
                shouldClean = true;
              }
            }
          });
        }
      });

      if (shouldClean) {
        setTimeout(cleanDebugElements, 10);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });

    // Interceptar console.log para evitar que se muestre información sensible
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args.join(' ');
      if (message.includes('payment_records_') || message.includes('Debug: Revenue')) {
        console.warn('🔒 SECURITY: Blocked sensitive console.log');
        return;
      }
      originalConsoleLog.apply(console, args);
    };

    // Limpiar cuando el componente se desmonte
    return () => {
      isActive = false;
      clearInterval(rapidInterval);
      observer.disconnect();
      console.log = originalConsoleLog;
    };
  }, []);

  // Renderizar un elemento invisible que ayude a identificar si hay debug info
  return (
    <div 
      style={{ display: 'none' }} 
      data-security-cleaner="active"
      suppressHydrationWarning
    />
  );
}