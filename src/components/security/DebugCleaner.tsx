import { useEffect } from 'react';

/**
 * Componente de seguridad que limpia cualquier información de debug
 * que pueda estar siendo mostrada en el DOM
 */
export function DebugCleaner() {
  useEffect(() => {
    // Función para limpiar cualquier elemento de debug del DOM
    const cleanDebugElements = () => {
      try {
        // Lista de patrones de texto sensible a eliminar
        const sensitivePatterns = [
          'Debug: Revenue Calculation',
          'Storage Key:',
          'payment_records_',
          'Has Records:',
          'Total Records:',
          'Sample Records:',
          'Current Month Paid:',
          'Current Month Revenue:',
          'Debug:',
          'Storage Key: payment_records_'
        ];

        // Buscar y eliminar cualquier elemento que contenga información sensible
        const debugSelectors = [
          '[data-debug]',
          '.debug-info',
          '.revenue-debug',
          '*[class*="debug"]',
          '*[id*="debug"]',
          'div',
          'span',
          'p',
          'pre',
          'code'
        ];

        debugSelectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
              const textContent = element.textContent || '';
              
              // Verificar si contiene algún patrón sensible
              const containsSensitiveInfo = sensitivePatterns.some(pattern => 
                textContent.includes(pattern)
              );

              if (containsSensitiveInfo) {
                console.warn('🔒 Security: Removing debug element from DOM', element);
                element.remove();
              }
            });
          } catch (error) {
            console.error('Error cleaning debug elements:', error);
          }
        });

        // Buscar específicamente por texto que contenga IDs de usuario
        const allTextNodes = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        const nodesToRemove: Node[] = [];
        let node;
        while (node = allTextNodes.nextNode()) {
          const text = node.textContent || '';
          if (text.includes('payment_records_') || 
              text.includes('Debug: Revenue') ||
              text.includes('Storage Key:') ||
              text.includes('Has Records:')) {
            nodesToRemove.push(node.parentElement || node);
          }
        }

        nodesToRemove.forEach(node => {
          try {
            node.remove();
          } catch (error) {
            console.error('Error removing node:', error);
          }
        });

      } catch (error) {
        console.error('Error in cleanDebugElements:', error);
      }
    };

    // Limpiar inmediatamente
    cleanDebugElements();

    // Limpiar cada 500ms para ser más agresivo
    const interval = setInterval(cleanDebugElements, 500);

    // Observer para detectar cambios en el DOM
    const observer = new MutationObserver(() => {
      cleanDebugElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Limpiar cuando el componente se desmonte
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Este componente no renderiza nada visible
  return null;
}