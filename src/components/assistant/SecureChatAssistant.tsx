import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, MessageCircle } from "lucide-react";
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
      console.log('SecureChatAssistant: Loading user data for:', user.id);

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
        supabase.from('maintenance_requests').select('*').eq('landlord_id', user?.id).limit(100)
      ]);

      const data: UserData = {
        properties: propertiesRes.data || [],
        tenants: tenantsData || [],
        units: unitsRes.data || [],
        payments: paymentsRes.data || [],
        maintenance: maintenanceRes.data || []
      };

      console.log('SecureChatAssistant: Loaded data:', {
        properties: data.properties.length,
        tenants: data.tenants.length,
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
      return "Estoy cargando tus datos, por favor espera un momento...";
    }

    const lowerQuery = query.toLowerCase();

    // Saludos y consultas generales
    if (lowerQuery.match(/(hola|hi|hey|buenos|buenas)/)) {
      return `¡Hola! 😊 Veo que tienes ${userData.properties.length} propiedades con ${userData.units.length} unidades y ${userData.tenants.filter(t => t.is_active).length} inquilinos activos. ¿En qué puedo ayudarte hoy?`;
    }

    // Consultas sobre propiedades
    if (lowerQuery.includes('propiedad')) {
      return handlePropertyQueries(lowerQuery);
    }

    // Consultas sobre inquilinos
    if (lowerQuery.match(/(inquilino|tenant)/)) {
      return handleTenantQueries(lowerQuery);
    }

    // Consultas sobre pagos e ingresos
    if (lowerQuery.match(/(pago|ingreso|dinero|cobr|gano|ganancia)/)) {
      return handlePaymentQueries(lowerQuery);
    }

    // Consultas sobre unidades
    if (lowerQuery.match(/(unidad|apartamento|ocupacion|vacia|libre)/)) {
      return handleUnitQueries(lowerQuery);
    }

    // Consultas sobre mantenimiento
    if (lowerQuery.match(/(mantenimiento|reparacion|arreglo)/)) {
      return handleMaintenanceQueries(lowerQuery);
    }

    // Resumen general
    if (lowerQuery.match(/(resumen|estado|situacion|como va|negocio)/)) {
      return handleGeneralSummary();
    }

    // Respuesta por defecto más conversacional
    return generateConversationalResponse(lowerQuery);
  };

  const handlePropertyQueries = (query: string): string => {
    const { properties } = userData!;

    if (properties.length === 0) {
      return "🏠 Aún no tienes propiedades registradas. ¡Es el momento perfecto para agregar tu primera propiedad! 🚀 Ve a la sección 'Propiedades' y haz clic en 'Agregar Propiedad'. ¿Te ayudo con el proceso? 😊";
    }

    if (query.includes('cuantas') || query.includes('total')) {
      const totalUnits = userData!.units.length;
      return `🏢 Tienes ${properties.length} propiedades registradas con un total de ${totalUnits} unidades. ${properties.length === 1 ? '¡Un buen comienzo!' : '¡Excelente portafolio!'} 🎯`;
    }

    const propertyList = properties.slice(0, 5).map(p => `• ${p.name || 'Propiedad sin nombre'}`).join('\n');
    return `🏠 **Tus propiedades (${properties.length}):**\n${propertyList}${properties.length > 5 ? '\n... y más' : ''}\n\n¿Te gustaría información específica sobre alguna? 😊`;
  };

  const handleTenantQueries = (query: string): string => {
    const { tenants } = userData!;
    const activeTenants = tenants.filter(t => t.is_active);

    if (query.includes('activos') || query.includes('cuantos')) {
      if (activeTenants.length === 0) {
        return "👥 Actualmente no tienes inquilinos activos. ¡Pero eso puede cambiar pronto! 🌟 ¿Te ayudo a agregar tu primer inquilino? Ve a la sección 'Inquilinos' y empieza a hacer crecer tu negocio. 💪";
      }

      const tenantList = activeTenants.slice(0, 5).map(t => `• ${t.name || 'Sin nombre'} - €${t.monthly_rent || 0}/mes`).join('\n');
      return `Inquilinos activos (${activeTenants.length}):\n${tenantList}${activeTenants.length > 5 ? '\n... y más' : ''}`;
    }

    if (tenants.length === 0) {
      return "Aún no tienes inquilinos registrados. ¿Te gustaría agregar tu primer inquilino?";
    }

    return `Tienes ${tenants.length} inquilinos registrados, ${tenants.filter(t => t.is_active).length} están activos.`;
  };

  const handlePaymentQueries = (query: string): string => {
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
    const activeTenants = tenants.filter(t => t.is_active);
    const potentialMonthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0);

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
    const { properties, tenants, units, maintenance } = userData!;

    const activeTenants = tenants.filter(t => t.is_active);
    const occupiedUnits = units.filter(u => !u.is_available).length;
    const monthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0);
    const pendingMaintenance = maintenance.filter(m => m.status === 'pending').length;
    const occupancyRate = units.length > 0 ? ((occupiedUnits / units.length) * 100).toFixed(1) : '0';

    return `📊 **Resumen de tu negocio:**
• ${properties.length} propiedades con ${units.length} unidades
• ${activeTenants.length} inquilinos activos (${occupancyRate}% ocupación)
• €${monthlyRevenue.toLocaleString()} ingresos mensuales potenciales
• ${pendingMaintenance} solicitudes de mantenimiento pendientes

¿Te gustaría información más específica sobre algún área?`;
  };

  const generateConversationalResponse = (query: string): string => {
    // Función para detectar palabras similares (tolerancia a errores de escritura)
    const fuzzyMatch = (word: string, targets: string[]): boolean => {
      return targets.some(target => {
        // Coincidencia exacta
        if (word.includes(target) || target.includes(word)) return true;
        
        // Tolerancia a errores comunes
        const distance = levenshteinDistance(word, target);
        return distance <= Math.max(1, Math.floor(target.length * 0.3));
      });
    };

    // Función para calcular distancia de Levenshtein (errores de escritura)
    const levenshteinDistance = (str1: string, str2: string): number => {
      const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
      
      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
      
      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1,
            matrix[j - 1][i] + 1,
            matrix[j - 1][i - 1] + indicator
          );
        }
      }
      
      return matrix[str2.length][str1.length];
    };

    // Detectar intenciones con tolerancia a errores
    const words = query.toLowerCase().split(/\s+/);
    
    // Propiedades (con errores comunes)
    if (fuzzyMatch(query, ['propiedad', 'propiedades', 'casa', 'casas', 'edificio', 'inmueble'])) {
      return handlePropertyQueries(query);
    }
    
    // Inquilinos (con errores comunes)
    if (fuzzyMatch(query, ['inquilino', 'inquilinos', 'tenant', 'tenants', 'arrendatario', 'cliente'])) {
      return handleTenantQueries(query);
    }
    
    // Pagos (con errores comunes)
    if (fuzzyMatch(query, ['pago', 'pagos', 'dinero', 'cobro', 'ingreso', 'renta', 'alquiler'])) {
      return handlePaymentQueries(query);
    }
    
    // Unidades (con errores comunes)
    if (fuzzyMatch(query, ['unidad', 'unidades', 'apartamento', 'depto', 'ocupacion', 'vacia', 'libre'])) {
      return handleUnitQueries(query);
    }
    
    // Mantenimiento (con errores comunes)
    if (fuzzyMatch(query, ['mantenimiento', 'reparacion', 'arreglo', 'problema', 'averia'])) {
      return handleMaintenanceQueries(query);
    }

    // Ayuda y funciones
    if (fuzzyMatch(query, ['ayuda', 'help', 'como', 'usar', 'funciona', 'tutorial'])) {
      return `🆘 **¡Estoy aquí para ayudarte!** Puedo ayudarte con:\n\n📊 **Información de tu negocio:**\n• Estado de propiedades e inquilinos\n• Resumen de pagos e ingresos\n• Ocupación de unidades\n\n🔧 **Funciones de la app:**\n• Cómo agregar inquilinos\n• Gestión de pagos\n• Seguimiento de mantenimiento\n\n¡Solo pregúntame lo que necesites! 😊`;
    }

    // Respuestas más inteligentes y contextuales
    const contextualResponses = [
      `🤔 Entiendo que quieres información, pero no estoy seguro sobre qué específicamente. \n\n💡 **Puedo ayudarte con:**\n• Tus ${userData?.properties.length || 0} propiedades\n• Tus ${userData?.tenants.filter(t => t.is_active).length || 0} inquilinos activos\n• Estado de pagos e ingresos\n• Ocupación de unidades\n\n¿Sobre cuál te gustaría saber más?`,
      
      `😊 ¡Perfecto! Veo que tienes consultas. Para darte la mejor respuesta:\n\n🎯 **Soy experto en:**\n• Análisis de tu cartera inmobiliaria\n• Seguimiento de inquilinos y pagos\n• Estadísticas de ocupación\n• Gestión de mantenimiento\n\n¿Qué área te interesa más?`,
      
      `🚀 ¡Excelente! Estoy aquí para maximizar tu éxito inmobiliario.\n\n📈 **Actualmente tienes:**\n• ${userData?.properties.length || 0} propiedades gestionadas\n• ${userData?.units.length || 0} unidades totales\n• ${((userData?.units.filter(u => !u.is_available).length || 0) / Math.max(userData?.units.length || 1, 1) * 100).toFixed(1)}% de ocupación\n\n¿Quieres profundizar en algún aspecto?`
    ];

    return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
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
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Asistente RentaFlux
          <Badge variant="secondary" className="ml-auto">
            {userData ? 'Conectado' : 'Cargando...'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                    }`}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg px-3 py-2 ${message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                    }`}>
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-70 mt-1">
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
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Pensando...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame sobre tus propiedades, inquilinos, pagos..."
              disabled={isLoading}
              className="flex-1"
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}