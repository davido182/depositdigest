
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initErrorMonitoring } from '@/utils/errorMonitoring'

// Inicializar monitoreo de errores
initErrorMonitoring();

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("Failed to find the root element");
} else {
  const root = createRoot(rootElement);
  root.render(<App />);
}
