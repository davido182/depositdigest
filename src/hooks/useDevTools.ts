// Development tools hook para RentaFlux
import React, { useEffect, useState } from 'react';
import { config } from '@/utils/config';
import { logger } from '@/utils/logger';
import { testData, seedTestData, clearTestData } from '@/utils/testUtils';
import { testStripeConfiguration, testStripeConnection, getStripeInfo } from '@/utils/stripeTest';
import { color } from 'framer-motion';
import { Logs } from 'lucide-react';
import { Toggle } from '@radix-ui/react-toggle';
import { Logs } from 'lucide-react';
import { Logs } from 'lucide-react';
import { Logs } from 'lucide-react';
import { Logs } from 'lucide-react';
import { color } from 'framer-motion';
import { Toggle } from '@radix-ui/react-toggle';
import { Logs } from 'lucide-react';
import { Logs } from 'lucide-react';
import { Logs } from 'lucide-react';
import { color } from 'framer-motion';

interface DevTools {
  isEnabled: boolean;
  logs: any[];
  testData: typeof testData;
  actions: {
    seedTestData: () => Promise<void>;
    clearTestData: () => Promise<void>;
    exportLogs: () => void;
    clearLogs: () => void;
    toggleDebugMode: () => void;
  };
  stats: {
    environment: string;
    version: string;
    logCount: number;
  };
}

export const useDevTools = (): DevTools => {
  const [isEnabled] = useState(config.features.enableDebugMode);
  const [logs, setLogs] = useState<any[]>([]);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;

    // Actualizar logs cada segundo
    const interval = setInterval(() => {
      setLogs(logger.exportLogs());
    }, 1000);

    // Agregar atajos de teclado para desarrollo
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + Shift + D = Toggle debug mode
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setDebugMode(prev => !prev);
        logger.info('Debug mode toggled', { enabled: !debugMode });
      }

      // Ctrl + Shift + L = Export logs
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        exportLogs();
      }

      // Ctrl + Shift + S = Seed test data
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        seedTestData();
      }

      // Ctrl + Shift + C = Clear test data
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        clearTestData();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isEnabled, debugMode]);

  const exportLogs = () => {
    const logsData = logger.exportLogs();
    const blob = new Blob([JSON.stringify(logsData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rentaflux-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logger.info('Logs exported');
  };

  const actions = {
    seedTestData: async () => {
      logger.info('Seeding test data...');
      await seedTestData();
    },

    clearTestData: async () => {
      logger.info('Clearing test data...');
      await clearTestData();
    },

    testStripe: async () => {
      logger.info('Testing Stripe configuration...');
      const result = await testStripeConnection();
      if (result.success) {
        logger.info('✅ Stripe test passed', result.details);
      } else {
        logger.error('❌ Stripe test failed', result);
      }
      return result;
    },

    exportLogs,

    clearLogs: () => {
      logger.clearLogs();
      setLogs([]);
      logger.info('Logs cleared');
    },

    toggleDebugMode: () => {
      setDebugMode(prev => !prev);
      logger.info('Debug mode toggled', { enabled: !debugMode });
    },
  };

  const stats = {
    environment: config.app.environment,
    version: config.app.version,
    logCount: logs.length,
    stripe: getStripeInfo(),
  };

  return {
    isEnabled,
    logs,
    testData,
    actions,
    stats,
  };
};

// Componente de DevTools para mostrar en desarrollo
export const DevToolsPanel: React.FC = () => {
  const devTools = useDevTools();

  if (!devTools.isEnabled) return null;

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    right: 0,
    width: '300px',
    height: '200px',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: '1rem',
    fontSize: '12px',
    zIndex: 9999,
    overflow: 'auto',
    borderTopLeftRadius: '8px',
  };

  const buttonStyle: React.CSSProperties = {
    marginRight: '0.5rem',
    padding: '2px 6px',
    fontSize: '10px',
    backgroundColor: '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '3px',
    cursor: 'pointer',
  };

  return React.createElement('div', { style: panelStyle }, [
    React.createElement('div', { key: 'header', style: { marginBottom: '1rem' } }, [
      React.createElement('strong', { key: 'title' }, '🛠️ RentaFlux DevTools'),
      React.createElement('div', { key: 'env' }, `Env: ${devTools.stats.environment}`),
      React.createElement('div', { key: 'version' }, `Version: ${devTools.stats.version}`),
      React.createElement('div', { key: 'logs' }, `Logs: ${devTools.stats.logCount}`),
      React.createElement('div', { key: 'stripe' }, `Stripe: ${devTools.stats.stripe.configured ? '✅' : '❌'} (${devTools.stats.stripe.keyType})`),
    ]),

    React.createElement('div', { key: 'buttons', style: { marginBottom: '1rem' } }, [
      React.createElement('button', {
        key: 'seed',
        onClick: devTools.actions.seedTestData,
        style: buttonStyle,
      }, 'Seed Data'),
      React.createElement('button', {
        key: 'clear',
        onClick: devTools.actions.clearTestData,
        style: buttonStyle,
      }, 'Clear Data'),
      React.createElement('button', {
        key: 'export',
        onClick: devTools.actions.exportLogs,
        style: buttonStyle,
      }, 'Export Logs'),
      React.createElement('button', {
        key: 'clearLogs',
        onClick: devTools.actions.clearLogs,
        style: buttonStyle,
      }, 'Clear Logs'),
      React.createElement('button', {
        key: 'testStripe',
        onClick: devTools.actions.testStripe,
        style: { ...buttonStyle, marginRight: 0 },
      }, 'Test Stripe'),
    ]),

    React.createElement('div', { key: 'shortcuts', style: { fontSize: '10px' } }, [
      React.createElement('strong', { key: 'shortcutsTitle' }, 'Shortcuts:'),
      React.createElement('div', { key: 'shortcut1' }, 'Ctrl+Shift+D: Toggle Debug'),
      React.createElement('div', { key: 'shortcut2' }, 'Ctrl+Shift+L: Export Logs'),
      React.createElement('div', { key: 'shortcut3' }, 'Ctrl+Shift+S: Seed Data'),
      React.createElement('div', { key: 'shortcut4' }, 'Ctrl+Shift+C: Clear Data'),
    ]),
  ]);
};