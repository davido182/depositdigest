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

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadUserData = async () => {
    try {
      console.log('🔍 Loading user data for assistant...');

      // Load all user data in parallel with error handling
      const [propertiesRes, tenantsRes, unitsRes, paymentsRes, maintenanceRes] = await Promise.all([
        supabase.from('properties').select('*').eq('landlord_id', user?.id).limit(50),
        supabase.from('tenants').select('*').eq('landlord_id', user?.id).limit(100),
        supabase.from('units').select('*').eq('user_id', user?.id).limit(200),
        supabase.from('payments').select('*').eq('user_id', user?.id).limit(500),
        supabase.from('maintenance_requests').select('*').eq('landlord_id', user?.id).limit(100)
      ]);

      const data: UserData = {
        properties: propertiesRes.data || [],
        tenants: tenantsRes.data || [],
        units: unitsRes.data || [],
        payments: paymentsRes.data || [],
        maintenance: maintenanceRes.data || []
      };

      setUserData(data);
      console.log('✅ User data loaded for assistant:', {
        properties: data.properties.length,
        tenants: data.tenants.length,
        units: data.units.length,
        payments: data.payments.length,
        maintenance: data.maintenance.length
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const processUserQuery = async (query: string): Promise<string> => {
    if (!userData) {
      return "¡Un momentito! 🔄 Estoy cargando toda tu información para darte la mejor respuesta posible... ¡Ya casi termino! 😊";
    }

    // Normalizar query para mejor comprensión (tolerancia a errores de tipeo)
    const normalizedQuery = query.toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    try {
      // Preguntas sobre RentaFlux
      if (normalizedQuery.match(/(que es|rentaflux|aplicacion|plataforma|sistema)/)) {
        return handleRentaFluxQueries(normalizedQuery);
      }

      // Preguntas sobre ayuda/manual
      if (normalizedQuery.includes('ayuda') || normalizedQuery.includes('como') || normalizedQuery.includes('manual') || normalizedQuery.includes('usar')) {
        return handleHelpQueries(normalizedQuery);
      }

      // Preguntas sobre propiedades (más tolerante)
      if (normalizedQuery.match(/(propiedad|edificio|inmueble|casa|departamento)/)) {
        return handlePropertyQueries(normalizedQuery);
      }

      // Preguntas sobre inquilinos (más tolerante)
      if (normalizedQuery.match(/(inquilino|tenant|arrendatario|huesped)/)) {
        return handleTenantQueries(normalizedQuery);
      }

      // Preguntas sobre pagos (más tolerante)
      if (normalizedQuery.match(/(pago|renta|dinero|ingreso|cobro|plata|euro|ganancia)/)) {
        return handlePaymentQueries(normalizedQuery);
      }

      // Preguntas sobre unidades (más tolerante)
      if (normalizedQuery.match(/(unidad|apartamento|cuarto|habitacion|depto)/)) {
        return handleUnitQueries(normalizedQuery);
      }

      // Preguntas sobre mantenimiento (más tolerante)
      if (normalizedQuery.match(/(mantenimiento|reparacion|arreglo|problema|falla)/)) {
        return handleMaintenanceQueries(normalizedQuery);
      }

      // Resumen general (más tolerante)
      if (normalizedQuery.match(/(resumen|estado|todo|general|negocio|situacion)/)) {
        return handleGeneralSummary();
      }

      // Saludos
      if (normalizedQuery.match(/(hola|buenos|buenas|saludos)/)) {
        return "¡Hola! 😊 ¡Qué gusto verte por aquí! 🎉 ¿En qué puedo ayudarte hoy con tu negocio inmobiliario? 🏠✨";
      }

      // Respuesta conversacional por defecto
      return generateConversationalResponse(normalizedQuery);

    } catch (error) {
      console.error('Error processing query:', error);
      return "¡Ups! 😅 Parece que tuve un pequeño problema procesando tu consulta. ¿Podrías intentar preguntármelo de otra manera? ¡Estoy aquí para ayudarte! 💪";
    }
  };

  const handlePropertyQueries = (query: string): string => {
    const { properties, units } = userData!;

    if (query.includes('cuántas') || query.includes('total')) {
      return `Tienes ${properties.length} propiedades registradas con un total de ${units.length} unidades.`;
    }

    if (query.includes('vacías') || query.includes('disponibles')) {
      const vacantUnits = units.filter(u => u.is_available);
      return `Actualmente tienes ${vacantUnits.length} unidades disponibles de ${units.length} totales.`;
    }

    if (properties.length === 0) {
      return "Aún no tienes propiedades registradas. ¿Te gustaría que te ayude a crear tu primera propiedad?";
    }

    const propertyList = properties.slice(0, 5).map(p => `• ${p.name} (${p.address})`).join('\n');
    return `Tienes ${properties.length} propiedades:\n${propertyList}${properties.length > 5 ? '\n... y más' : ''}`;
  };

  const handleTenantQueries = (query: string): string => {
    const { tenants } = userData!;

    if (query.includes('cuántos') || query.includes('total')) {
      const activeTenants = tenants.filter(t => t.is_active);
      return `Tienes ${activeTenants.length} inquilinos activos de ${tenants.length} totales.`;
    }

    if (query.includes('activos')) {
      const activeTenants = tenants.filter(t => t.is_active);
      if (activeTenants.length === 0) {
        return "No tienes inquilinos activos en este momento.";
      }
      const tenantList = activeTenants.slice(0, 5).map(t =>
        `• ${t.name} - €${t.rent_amount || 0}/mes`
      ).join('\n');
      return `Inquilinos activos (${activeTenants.length}):\n${tenantList}${activeTenants.length > 5 ? '\n... y más' : ''}`;
    }

    if (tenants.length === 0) {
      return "Aún no tienes inquilinos registrados. ¿Te gustaría agregar tu primer inquilino?";
    }

    return `Tienes ${tenants.length} inquilinos registrados, ${tenants.filter(t => t.is_active).length} están activos.`;
  };

  const handlePaymentQueries = (query: string): string => {
    const { tenants } = userData!;

    // Calcular ingresos mensuales reales
    const activeTenants = tenants.filter(t => t.is_active);
    const monthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0);

    if (query.match(/(ingreso|gano|ganancia|dinero|plata)/)) {
      if (monthlyRevenue === 0) {
        return "🤔 Veo que aún no tienes ingresos configurados. ¡No te preocupes! 💪 Puedes agregar inquilinos con sus rentas en la sección de Inquilinos para empezar a generar ingresos. ¿Te ayudo con eso? 😊";
      }
      return `¡Excelente! 💰 Tus ingresos mensuales potenciales son de €${monthlyRevenue.toLocaleString()} provenientes de ${activeTenants.length} inquilinos activos. ¡Tu negocio está generando buenos resultados! 🎉`;
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
    const monthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.rent_amount || 0), 0);
    const pendingMaintenance = maintenance.filter(m => m.status === 'pending').length;
    const occupancyRate = units.length > 0 ? ((occupiedUnits / units.length) * 100).toFixed(1) : '0';

    return `📊 **Resumen de tu negocio:**
• ${properties.length} propiedades con ${units.length} unidades
• ${activeTenants.length} inquilinos activos (${occupancyRate}% ocupación)
• €${monthlyRevenue.toLocaleString()} ingresos mensuales potenciales
• ${pendingMaintenance} solicitudes de mantenimiento pendientes

¿Te gustaría información más específica sobre algún área?`;
  };

  const handleRentaFluxQueries = (query: string): string => {
    return `🏠 **RentaFlux** es tu plataforma completa de gestión inmobiliaria! 🚀\n\nTe ayuda a:\n• 🏢 **Gestionar propiedades** y unidades\n• 👥 **Administrar inquilinos** y contratos\n• 💰 **Controlar pagos** y finanzas\n• 🔧 **Manejar mantenimiento** y solicitudes\n• 📊 **Analizar tu negocio** con reportes\n\n¡Todo en un solo lugar para que tu negocio inmobiliario sea más eficiente! ✨`;
  };

  const handleHelpQueries = (query: string): string => {
    if (query.match(/(como.*agregar.*inquilino|crear.*inquilino)/)) {
      return `¡Perfecto! 😊 **Manual: Agregar Inquilino**\n\n📋 **Pasos detallados:**\n1️⃣ Ve a la sección "Inquilinos" en el menú lateral\n2️⃣ Haz clic en "Agregar Inquilino" 👤\n3️⃣ **Datos básicos**: nombre, apellido, email, teléfono\n4️⃣ **Datos financieros**: renta mensual, depósito\n5️⃣ **Fechas**: inicio y fin de contrato\n6️⃣ **Asignar unidad** (opcional, puedes hacerlo después)\n7️⃣ ¡Guarda y listo! 🎉\n\n💡 **Tip**: Crea primero las propiedades para tener unidades disponibles.`;
    }

    if (query.match(/(como.*crear.*propiedad|agregar.*propiedad)/)) {
      return `🏠 **Manual: Crear Propiedad**\n\n📋 **Proceso completo:**\n1️⃣ Ve a "Propiedades" → "Agregar Propiedad" ➕\n2️⃣ **Información básica**:\n   • Nombre de la propiedad\n   • Dirección completa\n   • Descripción (opcional)\n3️⃣ **Configurar unidades**:\n   • Número de unidades\n   • Nombres personalizados (Ej: 101, 102, A, B)\n   • Renta mensual por unidad\n4️⃣ **Guardar** 💾\n\n🎯 **Después podrás**: editar unidades, asignar inquilinos, gestionar pagos.`;
    }

    if (query.match(/(como.*marcar.*pago|registrar.*pago)/)) {
      return `💰 **Manual: Gestión de Pagos**\n\n📋 **Tabla de Seguimiento:**\n1️⃣ Ve a "Pagos" → "Tabla de Seguimiento"\n2️⃣ Selecciona el año que quieres ver\n3️⃣ **Marcar pago**: haz clic en la casilla del mes ✅\n4️⃣ El sistema guarda automáticamente\n\n📊 **Procesador de Comprobantes:**\n1️⃣ Ve a "Pagos" → "Procesar Comprobantes"\n2️⃣ Sube archivos PDF/imágenes de recibos\n3️⃣ El sistema extrae la información automáticamente\n4️⃣ Confirma y guarda\n\n🎨 **Estados de pago**: Verde=Pagado, Amarillo=Pendiente, Rojo=Vencido, Gris=Futuro`;
    }

    if (query.match(/(como.*usar.*contabilidad|contabilidad)/)) {
      return `📊 **Manual: Contabilidad**\n\n💰 **Sección de Ingresos:**\n• Ve a "Contabilidad" para ver resumen financiero\n• Los ingresos se calculan automáticamente desde la tabla de pagos\n• Puedes ver ingresos mensuales y anuales\n\n📈 **Gastos e Impuestos:**\n• Registra gastos de mantenimiento\n• Configura impuestos y deducciones\n• El sistema calcula automáticamente el neto\n\n📋 **Reportes**: Exporta reportes en PDF para contabilidad externa.`;
    }

    return `📚 **Manual de Usuario - RentaFlux**\n\n🏠 **PROPIEDADES:**\n• Crear/editar propiedades\n• Configurar unidades y rentas\n• Gestionar disponibilidad\n\n👥 **INQUILINOS:**\n• Agregar inquilinos con contratos\n• Asignar a unidades específicas\n• Gestionar fechas de entrada/salida\n\n💰 **PAGOS:**\n• Tabla de seguimiento mensual\n• Procesador de comprobantes\n• Estados: Pagado/Pendiente/Vencido\n\n📊 **CONTABILIDAD:**\n• Ingresos automáticos\n• Registro de gastos\n• Cálculo de impuestos\n\n¿Sobre qué sección específica te gustaría saber más? 🤔`;
  };

  const generateConversationalResponse = (query: string): string => {
    // Respuestas más conversacionales basadas en el contexto
    const responses = [
      "🤔 Hmm, no estoy seguro de entender exactamente lo que necesitas. ¿Podrías ser más específico? Por ejemplo, ¿te refieres a propiedades, inquilinos, o pagos?",
      "😊 ¡Interesante pregunta! Para ayudarte mejor, ¿podrías decirme si buscas información sobre tus datos actuales o necesitas ayuda para usar alguna función?",
      "🎯 Quiero asegurarme de darte la información correcta. ¿Tu consulta es sobre el estado actual de tu negocio o necesitas ayuda con algún proceso específico?",
      "💡 ¡Perfecto! Estoy aquí para ayudarte. ¿Te gustaría que te muestre un resumen de tu negocio o prefieres que te explique cómo usar alguna función específica?"
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame sobre tus propiedades, inquilinos, pagos..."
              disabled={isLoading}
              className="flex-1"
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