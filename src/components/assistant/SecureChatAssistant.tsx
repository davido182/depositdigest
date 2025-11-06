import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface UserData {
  properties: any[];
  tenants: any[];
  units: any[];
  payments: any[];
  maintenance: any[];
}

export function SecureChatAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '¡Hola! 👋 Soy tu asistente personal de RentaFlux 🏠✨\n\n¡Estoy aquí para ayudarte con todo lo relacionado a tu negocio inmobiliario! 😊 Puedo contarte sobre tus propiedades, inquilinos, pagos, y hasta ayudarte a usar la aplicación.\n\n¿Qué te gustaría saber? 🤔',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Loading user data for chat assistant

      // Import tenant service
      const { tenantService } = await import('@/services/TenantService');
      
      const [propertiesRes, tenantsData, unitsRes, paymentsRes, maintenanceRes] = await Promise.all([
        supabase.from('properties').select('*').eq('landlord_id', user?.id).limit(50),
        tenantService.getTenants(),
        supabase.from('units').select(`
          *,
          properties!inner(landlord_id)
        `).eq('properties.landlord_id', user?.id).limit(200),
        supabase.from('payments').select(`
          *,
          tenants!inner(landlord_id)
        `).eq('tenants.landlord_id', user?.id).limit(500),
        // supabase.from('maintenance_requests').select('*').eq('landlord_id', user?.id).limit(100) // Deshabilitado temporalmente
        Promise.resolve({ data: [], error: null })
      ]);

      const data: UserData = {
        properties: propertiesRes.data || [],
        tenants: tenantsData || [],
        units: unitsRes.data || [],
        payments: paymentsRes.data || [],
        maintenance: maintenanceRes.data || []
      };

      // Security: Only log counts, never sensitive data
      console.log('SecureChatAssistant: Data loaded successfully:', {
        properties: data.properties.length,
        tenants: data.tenants.length,
        activeTenants: data.tenants.filter(t => t.status === 'active').length,
        units: data.units.length,
        payments: data.payments.length,
        maintenance: data.maintenance.length
      });

      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const processUserQuery = async (query: string): Promise<string> => {
    if (!userData) {
      return "Un momento, estoy cargando tus datos... 🔄";
    }

    const lowerQuery = query.toLowerCase().trim();

    // Saludos y conversación básica
    if (lowerQuery.match(/^(hola|hi|hello|buenas|buenos dias|buenas tardes|buenas noches|hey)$/)) {
      const hour = new Date().getHours();
      let greeting = "¡Hola!";
      if (hour < 12) greeting = "¡Buenos días!";
      else if (hour < 18) greeting = "¡Buenas tardes!";
      else greeting = "¡Buenas noches!";
      
      return `${greeting} 😊 Soy tu asistente de RentaFlux. ¿En qué puedo ayudarte hoy?`;
    }

    // Despedidas
    if (lowerQuery.match(/(adios|bye|hasta luego|nos vemos|chau)/)) {
      return "¡Hasta luego! 👋 Aquí estaré cuando me necesites. ¡Que tengas un excelente día! 😊";
    }

    // Consultas específicas sobre inquilinos (español e inglés)
    if (lowerQuery.match(/(inquilino.*antiguo|mas.*antiguo|quien.*lleva.*mas.*tiempo|oldest.*tenant|who.*is.*my.*oldest|longest.*tenant)/)) {
      return handleOldestTenantQuery();
    }

    if (lowerQuery.match(/(inquilino.*nuevo|mas.*nuevo|ultimo.*inquilino|newest.*tenant|latest.*tenant|most.*recent)/)) {
      return handleNewestTenantQuery();
    }

    // Consultas sobre inquilinos específicos por nombre
    if (lowerQuery.match(/^(maria|maría|jose|josé|juan|carlos|ana|luis|pedro|carmen|antonio|francisco|manuel|david|daniel|miguel|rafael|javier|alejandro|fernando|sergio|pablo|jorge|alberto|adrian|gonzalez|rodriguez|martinez|garcia|lopez|hernandez|perez|sanchez|ramirez|torres|flores|rivera|gomez|diaz|morales|cruz|ortiz|gutierrez|chavez|vargas|castillo|jimenez|ruiz|mendoza|silva|castro|herrera|medina|guerrero|ramos|ayala|delgado|aguilar|vega|leon|moreno|valdez|santiago|espinoza|soto|contreras|lara|pena|navarro|rojas|dominguez|acosta|rubio|escobar|reyes|luna|mejia|pacheco|cardenas|miranda|salazar|duran|trejo|estrada|campos|cortes|cedillo|sandoval|cabrera|figueroa|villanueva|rosales|vazquez|romero|camacho|cervantes|rios|alvarado|cano|avila|fuentes|tapia|meza|montes|trevino|valdovinos|galvan|salas|cordova|ochoa|zepeda|velasco|corona|juarez|espinosa|ibarra|escalante|nuñez|zavala|arroyo|cisneros|carrillo|montoya|nava|marquez|bautista|mercado|tello|guzman|caballero|franco|tovar|garza|villa|palma|duarte|mora|parra|orozco|rocha|medrano|aguirre|murillo|solis|ornelas|zapata|macias|saenz|hurtado|amaya|esquivel|castrejon|quintero|rosas|padilla|molina|torres|blanco|marin|cuevas|rico|beltran|serrano|iglesias|cortez|suarez|vidal|lozano|ferrer|pascual|santana|hidalgo|gimenez|rubio|moya|pardo|delgado|peña|vega|cano|prieto|nieto|garrido|santos|calvo|campos|vidal|reyes|cruz|jimenez|moreno|muñoz|alonso|romero|navarro|gutierrez|torres|dominguez|vazquez|ramos|gil|ramirez|serrano|blanco|molina|morales|suarez|ortega|delgado|castro|ortiz|rubio|marin|sanz|iglesias|nuñez|medina|garrido|santos|castillo|cortes|lozano|guerrero|cano|prieto|mendez|calvo|cruz|gallego|vidal|leon|herrera|marquez|perez|moreno|carmona|jimenez|ruiz|hernandez|lopez|gonzalez|martin|garcia|rodriguez|fernandez|alvarez|gomez|sanchez|diaz|vazquez|ramos|castro|suarez|vargas|herrera|ortega|romero|soto|contreras|mendoza|guerrero|medina|rojas|campos|flores|luna|torres|rivera|gomez|morales|reyes|cruz|gutierrez|ortiz|chavez|ramirez|castillo|herrera|vazquez|moreno|jimenez|ruiz|hernandez|lopez|gonzalez|garcia|rodriguez|fernandez|martinez|sanchez|perez|gomez|martin|diaz|muppet|sr\.?\s*muppet|señor\s*muppet|mr\.?\s*muppet)(\s|$)/)) {
      return handleSpecificTenantQuery(lowerQuery);
    }

    // Consultas sobre pagos específicos
    if (lowerQuery.match(/(quien.*debe|quien.*no.*pago|pendiente.*pagar)/)) {
      return handlePendingPaymentsQuery();
    }

    if (lowerQuery.match(/(cuanto.*gano|ingresos.*mes|dinero.*mes)/)) {
      return handleMonthlyIncomeQuery();
    }

    // Consejos de negocio específicos
    if (lowerQuery.match(/(mejorar.*negocio|consejos.*negocio|como.*mejorar|que.*hacer.*mejorar|expandir.*portafolio|crecer.*negocio|estrategias|optimizar|aumentar.*ingresos)/)) {
      return handleBusinessAdviceQuery();
    }

    // Consultas generales por categoría (español e inglés)
    if (lowerQuery.match(/(propiedad|propiedades|casa|edificio|property|properties|building|house)/)) {
      return handlePropertyQueries(query);
    }
    
    if (lowerQuery.match(/(inquilino|inquilinos|tenant|tenants|renter|renters)/)) {
      return handleTenantQueries(query);
    }
    
    if (lowerQuery.match(/(pago|pagos|dinero|cobro|ingreso|payment|payments|money|income|rent|revenue)/)) {
      return handlePaymentQueries(query);
    }
    
    if (lowerQuery.match(/(unidad|unidades|apartamento|ocupacion|unit|units|apartment|occupancy|vacancy)/)) {
      return handleUnitQueries(query);
    }

    // Ayuda
    if (lowerQuery.match(/(ayuda|help|que.*puedes.*hacer)/)) {
      return `¡Por supuesto! 😊 Puedo ayudarte con:

📊 **Información específica:**
• "¿Cuál es mi inquilino más antiguo?"
• "¿Quién me debe dinero?"
• "¿Cuánto gané este mes?"

🏠 **Estado general:**
• "¿Cómo va mi negocio?"
• "Resumen de mis propiedades"
• "Estado de ocupación"

¡Pregúntame cualquier cosa específica! 🚀`;
    }

    // Respuesta inteligente por defecto
    return generateSmartResponse(query);
  };

  const handleOldestTenantQuery = (): string => {
    const activeTenants = userData!.tenants.filter(t => t.status === 'active');
    
    if (activeTenants.length === 0) {
      return "No tienes inquilinos activos en este momento. 🏠";
    }

    // Buscar el inquilino con fecha de ingreso más antigua
    const oldestTenant = activeTenants.reduce((oldest, current) => {
      const oldestDate = new Date(oldest.lease_start_date || oldest.moveInDate || '2024-01-01');
      const currentDate = new Date(current.lease_start_date || current.moveInDate || '2024-01-01');
      return currentDate < oldestDate ? current : oldest;
    });

    const startDate = new Date(oldestTenant.lease_start_date || oldestTenant.moveInDate || '2024-01-01');
    const monthsAgo = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));

    return `Tu inquilino más antiguo es **${oldestTenant.name || 'Sin nombre'}** 👤
    
📅 Lleva contigo ${monthsAgo} meses (desde ${startDate.toLocaleDateString('es-ES')})
🏠 Unidad: ${oldestTenant.unit_number || oldestTenant.unit || 'N/A'}
💰 Renta: €${oldestTenant.rent_amount || oldestTenant.rentAmount || 0}/mes

¡Un inquilino de confianza! 🌟`;
  };

  const handleNewestTenantQuery = (): string => {
    const activeTenants = userData!.tenants.filter(t => t.status === 'active');
    
    if (activeTenants.length === 0) {
      return "No tienes inquilinos activos en este momento. 🏠";
    }

    const newestTenant = activeTenants.reduce((newest, current) => {
      const newestDate = new Date(newest.lease_start_date || newest.moveInDate || '2024-01-01');
      const currentDate = new Date(current.lease_start_date || current.moveInDate || '2024-01-01');
      return currentDate > newestDate ? current : newest;
    });

    const startDate = new Date(newestTenant.lease_start_date || newestTenant.moveInDate || '2024-01-01');
    const daysAgo = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return `Tu inquilino más reciente es **${newestTenant.name || 'Sin nombre'}** 🆕
    
📅 Ingresó hace ${daysAgo} días (${startDate.toLocaleDateString('es-ES')})
🏠 Unidad: ${newestTenant.unit_number || newestTenant.unit || 'N/A'}
💰 Renta: €${newestTenant.rent_amount || newestTenant.rentAmount || 0}/mes

¡Bienvenido al equipo! 🎉`;
  };

  const handlePendingPaymentsQuery = (): string => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const storageKey = `payment_records_${user?.id}_${currentYear}`;
    
    try {
      const storedRecords = localStorage.getItem(storageKey);
      const activeTenants = userData!.tenants.filter(t => t.status === 'active');
      
      if (storedRecords) {
        const records = JSON.parse(storedRecords);
        const paidTenants = records.filter((r: any) => 
          r.year === currentYear && r.month === currentMonth && r.paid
        ).map((r: any) => r.tenantName);
        
        const pendingTenants = activeTenants.filter(t => !paidTenants.includes(t.name || ''));
        
        if (pendingTenants.length === 0) {
          return "¡Excelente! 🎉 Todos tus inquilinos están al día con sus pagos este mes. 👏";
        }

        const pendingList = pendingTenants.slice(0, 3).map(t => 
          `• ${t.name || 'Sin nombre'} - €${t.rent_amount || t.rentAmount || 0}`
        ).join('\n');

        return `Tienes ${pendingTenants.length} inquilinos con pagos pendientes: 📋

${pendingList}${pendingTenants.length > 3 ? '\n... y más' : ''}

💡 Puedes revisar el detalle en la tabla de seguimiento de pagos.`;
      }
    } catch (error) {
      console.error('Error reading payment records:', error);
    }

    return "No puedo acceder a los datos de pagos en este momento. Revisa la tabla de seguimiento de pagos para más detalles. 📊";
  };

  const handleMonthlyIncomeQuery = (): string => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const storageKey = `payment_records_${user?.id}_${currentYear}`;
    let actualIncome = 0;
    
    try {
      const storedRecords = localStorage.getItem(storageKey);
      if (storedRecords) {
        const records = JSON.parse(storedRecords);
        const currentMonthPayments = records.filter((r: any) => 
          r.year === currentYear && r.month === currentMonth && r.paid
        );
        actualIncome = currentMonthPayments.reduce((sum: number, payment: any) => 
          sum + (payment.amount || 0), 0
        );
      }
    } catch (error) {
      console.error('Error reading payment records:', error);
    }

    const activeTenants = userData!.tenants.filter(t => t.status === 'active');
    const potentialIncome = activeTenants.reduce((sum, t) => sum + (t.rent_amount || t.rentAmount || 0), 0);

    if (actualIncome === 0 && potentialIncome === 0) {
      return "Aún no tienes ingresos configurados. Agrega inquilinos para empezar a generar ingresos. 💰";
    }

    return `💰 **Ingresos de ${monthNames[currentMonth]}:**

✅ **Cobrado:** €${actualIncome.toLocaleString()}
📊 **Potencial:** €${potentialIncome.toLocaleString()}
📈 **Progreso:** ${potentialIncome > 0 ? ((actualIncome / potentialIncome) * 100).toFixed(0) : 0}%

${actualIncome >= potentialIncome ? '🎉 ¡Perfecto! Has cobrado todo.' : '⏰ Aún hay pagos pendientes.'}`;
  };

  const handleBusinessAdviceQuery = (): string => {
    if (!userData) return "Cargando datos...";
    
    const { properties, tenants, units } = userData;
    const activeTenants = tenants.filter(t => t.status === 'active');
    const occupancyRate = units.length > 0 ? (activeTenants.length / units.length) * 100 : 0;
    const monthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.rent_amount || t.rentAmount || 0), 0);
    
    let advice = '💡 **Consejos personalizados para tu negocio:**\n\n';
    
    // Análisis de ocupación
    if (occupancyRate >= 95) {
      advice += `🎯 **Excelente ocupación (${occupancyRate.toFixed(0)}%):**\n`;
      advice += '• Considera aumentos de renta del 3-5% anual\n';
      advice += '• Es momento de expandir tu portafolio\n';
      advice += '• Implementa mejoras que justifiquen precios premium\n';
      advice += '• Busca propiedades en zonas similares\n\n';
    } else if (occupancyRate >= 80) {
      advice += `📈 **Buena ocupación (${occupancyRate.toFixed(0)}%):**\n`;
      advice += '• Mejora marketing de unidades vacías\n';
      advice += '• Revisa precios vs. competencia local\n';
      advice += '• Ofrece incentivos (1er mes gratis)\n';
      advice += '• Implementa tours virtuales\n\n';
    } else {
      advice += `⚠️ **Ocupación baja (${occupancyRate.toFixed(0)}%):**\n`;
      advice += '• Revisa urgentemente tus precios\n';
      advice += '• Mejora fotos y descripción de unidades\n';
      advice += '• Considera renovaciones menores\n';
      advice += '• Evalúa cambiar de agente inmobiliario\n\n';
    }
    
    // Consejos de ingresos
    if (monthlyRevenue > 0) {
      advice += '💰 **Optimización de ingresos:**\n';
      advice += '• Reserva 20-30% para reinversión\n';
      advice += '• Ofrece servicios adicionales (parking, storage)\n';
      advice += '• Implementa pagos automáticos\n';
      advice += '• Considera contratos más largos con descuentos\n\n';
    }
    
    // Consejos de mantenimiento
    advice += '🔧 **Mantenimiento inteligente:**\n';
    advice += '• Inspecciones preventivas cada 3 meses\n';
    advice += '• Mantén reserva del 5-10% para reparaciones\n';
    advice += '• Crea red de proveedores confiables\n';
    advice += '• Documenta todo para deducciones fiscales\n\n';
    
    // Estrategias de crecimiento
    if (properties.length >= 2) {
      advice += '🚀 **Expansión del portafolio:**\n';
      advice += '• Analiza ROI de cada propiedad\n';
      advice += '• Considera refinanciamiento para comprar más\n';
      advice += '• Diversifica ubicaciones geográficas\n';
      advice += '• Evalúa propiedades comerciales\n\n';
    } else {
      advice += '🌱 **Primeros pasos de crecimiento:**\n';
      advice += '• Establece un fondo de emergencia\n';
      advice += '• Mejora tu score crediticio\n';
      advice += '• Busca tu segunda propiedad\n';
      advice += '• Considera sociedades con otros inversores\n\n';
    }
    
    // Consejo final personalizado
    if (occupancyRate >= 90 && monthlyRevenue > 1000) {
      advice += '🎉 **¡Tu negocio va excelente!** Considera hablar con un asesor fiscal para optimizar impuestos y planificar la expansión.';
    } else if (occupancyRate >= 70) {
      advice += '👍 **Vas por buen camino.** Enfócate en llenar las unidades vacías y luego piensa en crecer.';
    } else {
      advice += '💪 **Hay oportunidades de mejora.** Prioriza la ocupación antes que la expansión.';
    }
    
    return advice;
  };

  const handleSpecificTenantQuery = (query: string): string => {
    if (!userData) return "Cargando datos...";
    
    const { tenants } = userData;
    const activeTenants = tenants.filter(t => t.status === 'active');
    
    if (activeTenants.length === 0) {
      return "No tienes inquilinos activos en este momento. 🏠";
    }

    // Extraer el nombre del query
    const words = query.toLowerCase().split(/\s+/);
    let searchName = '';
    
    // Buscar nombres comunes o específicos
    for (const word of words) {
      const cleanWord = word.replace(/[^\w\sáéíóúñü]/gi, '');
      if (cleanWord.length > 2) {
        const foundTenant = activeTenants.find(t => 
          t.name && t.name.toLowerCase().includes(cleanWord)
        );
        if (foundTenant) {
          searchName = cleanWord;
          break;
        }
      }
    }

    if (!searchName) {
      // Si no encuentra nombre específico, mostrar lista de inquilinos
      const tenantList = activeTenants.slice(0, 3).map(t => 
        `• ${t.name || 'Sin nombre'}`
      ).join('\n');
      
      return `No encontré ese nombre específico. Tus inquilinos activos son: 👥

${tenantList}${activeTenants.length > 3 ? '\n... y más' : ''}

¿Sobre cuál quieres saber más?`;
    }

    // Buscar el inquilino específico
    const tenant = activeTenants.find(t => 
      t.name && t.name.toLowerCase().includes(searchName)
    );

    if (!tenant) {
      return `No encontré a ningún inquilino con ese nombre. 🤔 ¿Te refieres a alguno de estos?

${activeTenants.slice(0, 3).map(t => `• ${t.name || 'Sin nombre'}`).join('\n')}`;
    }

    // Información detallada del inquilino
    const startDate = new Date(tenant.lease_start_date || tenant.moveInDate || '2024-01-01');
    const monthsAgo = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const rent = tenant.rent_amount || tenant.rentAmount || 0;

    return `📋 **${tenant.name || 'Sin nombre'}**

📅 **Tiempo contigo:** ${monthsAgo} meses (desde ${startDate.toLocaleDateString('es-ES')})
🏠 **Unidad:** ${tenant.unit_number || tenant.unit || 'N/A'}
💰 **Renta:** €${rent}/mes
📊 **Estado:** ${tenant.status === 'active' ? 'Activo ✅' : tenant.status}

¿Quieres saber algo más específico sobre ${tenant.name || 'este inquilino'}?`;
  };

  const generateSmartResponse = (query: string): string => {
    if (!userData) return "Cargando datos...";
    
    const { tenants, units } = userData;
    const activeTenants = tenants.filter(t => t.status === 'active');
    const lowerQuery = query.toLowerCase();
    
    // Detectar si menciona nombres pero no los encuentra
    if (lowerQuery.match(/^[a-záéíóúñü]{2,}(\s[a-záéíóúñü]{2,})?$/)) {
      const tenantList = activeTenants.slice(0, 3).map(t => 
        `• ${t.name || 'Sin nombre'}`
      ).join('\n');
      
      return `¿Te refieres a alguno de tus inquilinos? 🤔

${tenantList}${activeTenants.length > 3 ? '\n... y más' : ''}

Puedes preguntarme cosas como:
• "¿Cómo está María?" 
• "Información de Juan"
• "¿Cuánto paga Carlos?"`;
    }

    // Detectar consultas en inglés no reconocidas
    if (lowerQuery.match(/(who|what|how|when|where|which|tell|show|give|find)/)) {
      return `I can help you in Spanish! 😊 Try asking:

• "¿Quién es mi inquilino más antiguo?" (Who is my oldest tenant?)
• "¿Cuánto gané este mes?" (How much did I earn this month?)
• "¿Quién me debe dinero?" (Who owes me money?)

Or just ask about your tenants by name! 🏠`;
    }

    // Respuestas contextuales inteligentes
    const responses = [
      `No estoy seguro de entender. 🤔 

Tienes ${activeTenants.length} inquilinos activos. Puedes preguntarme sobre ellos por nombre o pedirme información específica.

¿Qué te gustaría saber?`,
      
      `¡Puedo ayudarte! 😊 Prueba preguntarme:

• Sobre inquilinos específicos por nombre
• "¿Quién es mi inquilino más antiguo?"
• "¿Cuánto gané este mes?"
• "Consejos para mi negocio"`,
      
      `Tienes ${units.length} unidades con ${((units.filter(u => !u.is_available).length / Math.max(units.length, 1)) * 100).toFixed(0)}% de ocupación. 📊

¿Quieres saber algo específico sobre tus inquilinos o propiedades?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handlePropertyQueries = (_query: string): string => {
    const { properties, units } = userData!;

    if (properties.length === 0) {
      return "No tienes propiedades registradas aún. 🏠 ¿Te ayudo a agregar tu primera propiedad?";
    }

    if (_query.includes('cuantas') || _query.includes('total') || _query.includes('how many')) {
      return `Tienes ${properties.length} propiedades con ${units.length} unidades totales. 🏢 ${properties.length === 1 ? '¡Buen comienzo!' : '¡Excelente portafolio!'}`;
    }

    const propertyList = properties.slice(0, 3).map(p => 
      `• ${p.name || 'Propiedad sin nombre'}`
    ).join('\n');
    
    return `Tus propiedades (${properties.length}): 🏠

${propertyList}${properties.length > 3 ? '\n... y más' : ''}

¿Quieres saber algo específico sobre alguna?`;
  };

  const handleTenantQueries = (_query: string): string => {
    const { tenants } = userData!;
    const activeTenants = tenants.filter(t => t.status === 'active');

    if (activeTenants.length === 0) {
      return "No tienes inquilinos activos en este momento. 🏠 ¿Te ayudo a agregar tu primer inquilino?";
    }

    if (_query.includes('cuantos') || _query.includes('activos') || _query.includes('active') || _query.includes('how many')) {
      const tenantList = activeTenants.slice(0, 3).map(t => 
        `• ${t.name || 'Sin nombre'} - €${t.rent_amount || t.rentAmount || 0}/mes`
      ).join('\n');
      
      return `Tienes ${activeTenants.length} inquilinos activos: 👥

${tenantList}${activeTenants.length > 3 ? '\n... y más' : ''}`;
    }

    return `Tienes ${activeTenants.length} inquilinos activos de ${tenants.length} totales. 📊 ¿Quieres saber algo específico sobre alguno?`;
  };

  const handlePaymentQueries = (_query: string): string => {
    const { tenants } = userData!;

    // Calcular ingresos REALES del mes actual desde localStorage (tabla de seguimiento)
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const storageKey = `payment_records_${user?.id}_${currentYear}`;
    
    let actualMonthlyIncome = 0;
    let paidTenantsCount = 0;
    
    try {
      const storedRecords = localStorage.getItem(storageKey);
      if (storedRecords) {
        const records = JSON.parse(storedRecords);
        const currentMonthPayments = records.filter((r: any) => 
          r.year === currentYear && 
          r.month === currentMonth && 
          r.paid === true
        );
        
        actualMonthlyIncome = currentMonthPayments.reduce((sum: number, payment: any) => 
          sum + (payment.amount || 0), 0
        );
        paidTenantsCount = currentMonthPayments.length;
      }
    } catch (error) {
      console.error('Error reading payment records:', error);
    }

    // Calcular ingresos potenciales (de inquilinos activos)
    const activeTenants = tenants.filter(t => t.status === 'active');
    const potentialMonthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0);

    if (query.match(/(ingreso|gano|ganancia|dinero|plata)/)) {
      if (actualMonthlyIncome === 0 && potentialMonthlyRevenue === 0) {
        return "🤔 Veo que aún no tienes ingresos configurados. ¡No te preocupes! 💪 Puedes agregar inquilinos con sus rentas en la sección de Inquilinos para empezar a generar ingresos. ¿Te ayudo con eso? 😊";
      }
      
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      
      return `💰 **Ingresos de ${monthNames[currentMonth]} ${currentYear}:**\n\n` +
             `✅ **Cobrado:** €${actualMonthlyIncome.toLocaleString()} (${paidTenantsCount} inquilinos)\n` +
             `📊 **Potencial:** €${potentialMonthlyRevenue.toLocaleString()} (${activeTenants.length} inquilinos activos)\n` +
             `📈 **Tasa de cobro:** ${potentialMonthlyRevenue > 0 ? ((actualMonthlyIncome / potentialMonthlyRevenue) * 100).toFixed(1) : 0}%\n\n` +
             `${actualMonthlyIncome < potentialMonthlyRevenue ? '⚠️ Tienes pagos pendientes por cobrar.' : '🎉 ¡Excelente! Has cobrado todo este mes.'}`;
    }

    if (query.match(/(pendiente|debe|pagar|cobrar)/)) {
      // Usar localStorage para pagos pendientes (datos reales del tracker)
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const storageKey = `payment_records_${user?.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(storageKey);

      if (storedRecords) {
        try {
          const records = JSON.parse(storedRecords);
          const currentMonthRecords = records.filter((r: any) =>
            r.year === currentYear && r.month === currentMonth && r.paid
          );
          const paidCount = currentMonthRecords.length;
          const pendingCount = activeTenants.length - paidCount;

          if (pendingCount > 0) {
            return `📋 Tienes ${pendingCount} inquilinos con pagos pendientes este mes de ${activeTenants.length} totales. ¡Puedes revisar quiénes son en la tabla de seguimiento de pagos! 💼`;
          } else {
            return "¡Fantástico! 🎊 Todos tus inquilinos están al día con sus pagos este mes. ¡Excelente gestión! 👏";
          }
        } catch (error) {
          console.error('Error parsing payment records:', error);
        }
      }

      if (activeTenants.length === 0) {
        return "🏠 Aún no tienes inquilinos activos registrados. ¡Vamos a cambiar eso! Puedes agregar inquilinos en la sección correspondiente. ¿Te gustaría que te explique cómo? 😊";
      }

      return `📊 Tienes ${activeTenants.length} inquilinos activos. Para ver el estado exacto de los pagos, revisa la tabla de seguimiento en la sección de Pagos. ¡Ahí tienes todo el detalle! 📈`;
    }

    if (activeTenants.length === 0) {
      return "🏠 Veo que aún no tienes inquilinos activos. ¡Pero eso puede cambiar pronto! 🚀 Agrega tus primeros inquilinos para empezar a generar ingresos. ¿Te ayudo con el proceso? 😊";
    }

    const monthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0);
    return `💼 Tienes ${activeTenants.length} inquilinos activos generando €${monthlyRevenue.toLocaleString()} mensuales potenciales. ¡Tu negocio está en marcha! 🎯`;
  };

  const handleUnitQueries = (query: string): string => {
    const { units } = userData!;

    if (units.length === 0) {
      return "🏠 Veo que aún no tienes unidades registradas. ¡Pero eso es fácil de solucionar! 😊 Crea tu primera propiedad y configura las unidades. ¿Te ayudo con el proceso? 🚀";
    }

    const totalUnits = units.length;
    const occupiedUnits = units.filter(u => !u.is_available).length;
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0';

    if (query.match(/(ocupacion|ocupada)/)) {
      if (occupancyRate === '100.0') {
        return `¡WOW! 🎉 ¡Tienes el 100% de ocupación! Todas tus ${totalUnits} unidades están ocupadas. ¡Eres un crack gestionando propiedades! 👏🏆`;
      }
      return `📊 Tienes ${occupiedUnits} unidades ocupadas de ${totalUnits} totales. ¡Eso es un ${occupancyRate}% de ocupación! ${parseFloat(occupancyRate) > 80 ? '¡Excelente trabajo! 🎯' : '¡Vamos por más! 💪'}`;
    }

    if (query.match(/(vacia|libre|disponible)/)) {
      if (vacantUnits === 0) {
        return "¡INCREÍBLE! 🎊 ¡Todas tus unidades están ocupadas! No tienes ninguna vacía. ¡Eres todo un profesional! 🏆✨";
      }
      return `🏘️ Tienes ${vacantUnits} unidades disponibles de ${totalUnits} totales. ¡Oportunidades para crecer! 📈 ¿Necesitas ayuda para promocionarlas? 😊`;
    }

    const emoji = parseFloat(occupancyRate) > 80 ? '🎯' : parseFloat(occupancyRate) > 60 ? '📈' : '💪';
    return `🏠 **Resumen de tus unidades:**\n• ${totalUnits} unidades totales\n• ${occupiedUnits} ocupadas ${emoji}\n• ${vacantUnits} disponibles\n• ${occupancyRate}% de ocupación\n\n${parseFloat(occupancyRate) > 80 ? '¡Excelente gestión! 👏' : '¡Sigamos creciendo! 🚀'}`;
  };

  const handleMaintenanceQueries = (query: string): string => {
    const { maintenance } = userData!;

    const pendingMaintenance = maintenance.filter(m => m.status === 'pending');
    const urgentMaintenance = maintenance.filter(m => m.priority === 'high' || m.priority === 'emergency');

    if (query.includes('pendientes') || query.includes('urgentes')) {
      if (pendingMaintenance.length === 0) {
        return "No tienes solicitudes de mantenimiento pendientes. ¡Todo está en orden!";
      }
      return `Tienes ${pendingMaintenance.length} solicitudes de mantenimiento pendientes, ${urgentMaintenance.length} son urgentes.`;
    }

    return `Tienes ${maintenance.length} solicitudes de mantenimiento en total, ${pendingMaintenance.length} están pendientes.`;
  };

  const handleGeneralSummary = (): string => {
    if (!userData) return "Cargando datos...";
    const { properties, tenants, units, maintenance } = userData;

    const activeTenants = tenants.filter(t => t.status === 'active');
    const occupiedUnits = units.filter(u => !u.is_available).length;
    const monthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0);
    const pendingMaintenance = maintenance.filter(m => m.status === 'pending').length;
    const occupancyRate = units.length > 0 ? ((occupiedUnits / units.length) * 100).toFixed(1) : '0';

    // Generar consejos proactivos basados en los datos
    let businessAdvice = '';
    const occupancyNum = parseFloat(occupancyRate);
    
    if (occupancyNum < 70) {
      businessAdvice = `\n💡 **Consejo:** Tu ocupación está en ${occupancyRate}%. Considera:\n• Revisar precios de mercado\n• Mejorar marketing de unidades vacías\n• Ofrecer incentivos a nuevos inquilinos`;
    } else if (occupancyNum > 95) {
      businessAdvice = `\n🚀 **Oportunidad:** ¡Excelente ocupación del ${occupancyRate}%! Es momento de:\n• Considerar aumentos de renta graduales\n• Expandir tu portafolio\n• Implementar mejoras que justifiquen precios premium`;
    } else if (pendingMaintenance > 3) {
      businessAdvice = `\n⚠️ **Atención:** Tienes ${pendingMaintenance} solicitudes de mantenimiento pendientes. Prioriza las urgentes para mantener la satisfacción de inquilinos.`;
    } else {
      businessAdvice = `\n✨ **Excelente gestión!** Tu negocio está bien balanceado. Considera diversificar o mejorar servicios para aumentar valor.`;
    }

    return `📊 **Resumen de tu negocio:**
• ${properties.length} propiedades con ${units.length} unidades
• ${activeTenants.length} inquilinos activos (${occupancyRate}% ocupación)
• €${monthlyRevenue.toLocaleString()} ingresos mensuales potenciales
• ${pendingMaintenance} solicitudes de mantenimiento pendientes${businessAdvice}

¿Te gustaría profundizar en alguna estrategia específica? 🎯`;
  };

  const generateConversationalResponse = (_query: string): string => {
    if (!userData) return "Cargando datos...";
    
    // Respuestas contextuales simples
    const responses = [
      `🤔 Entiendo que quieres información. \n\n💡 **Puedo ayudarte con:**\n• Tus ${userData.properties.length} propiedades\n• Tus ${userData.tenants.filter(t => t.status === 'active').length} inquilinos activos\n• Estado de pagos e ingresos\n• Ocupación de unidades\n\n¿Sobre cuál te gustaría saber más?`,
      
      `😊 ¡Perfecto! Veo que tienes consultas. \n\n🎯 **Soy experto en:**\n• Análisis de tu cartera inmobiliaria\n• Seguimiento de inquilinos y pagos\n• Estadísticas de ocupación\n• Gestión de mantenimiento\n\n¿Qué área te interesa más?`,
      
      `🚀 ¡Excelente! Estoy aquí para maximizar tu éxito inmobiliario.\n\n📈 **Actualmente tienes:**\n• ${userData.properties.length} propiedades gestionadas\n• ${userData.units.length} unidades totales\n• ${((userData.units.filter(u => !u.is_available).length) / Math.max(userData.units.length, 1) * 100).toFixed(1)}% de ocupación\n\n¿Quieres profundizar en algún aspecto?`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Mantener focus en el input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    try {
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await processUserQuery(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Lo siento, hubo un error procesando tu mensaje. ¿Puedes intentar de nuevo?',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Asegurar que el input mantenga el focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[700px] flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex-shrink-0">
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Asistente RentaFlux</div>
            <div className="text-xs text-white/80">Tu consultor inmobiliario inteligente</div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            {userData ? '🟢 Conectado' : '🔄 Cargando...'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollAreaRef}>
          <div className="space-y-6 min-h-full flex flex-col">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[90%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-md ${message.type === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                    }`}>
                    {message.type === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 shadow-sm min-w-0 flex-1 ${message.type === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed break-words">{message.content}</div>
                    <div className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                      {message.timestamp.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex items-center justify-center shadow-md">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-600">Analizando tus datos...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Spacer para empujar el input hacia abajo */}
            <div className="flex-1 min-h-4"></div>
          </div>
        </ScrollArea>

        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="💬 Pregúntame sobre tu negocio, consejos, estrategias..."
              disabled={isLoading}
              className="flex-1 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl bg-white shadow-sm"
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl px-4 shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-center">
            💡 Prueba: "¿cómo mejorar mi ocupación?" o "consejos para mi negocio"
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
