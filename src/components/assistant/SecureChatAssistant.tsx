import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
      content: '¡Hola! Soy tu asistente de RentaFlux. Puedo ayudarte con información sobre tus propiedades, inquilinos, pagos y más. ¿En qué puedo ayudarte?',
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
      return "Aún estoy cargando tus datos. Por favor espera un momento e intenta de nuevo.";
    }

    const lowerQuery = query.toLowerCase();
    
    // Análisis de intención seguro y limitado
    try {
      // Preguntas sobre propiedades
      if (lowerQuery.includes('propiedad') || lowerQuery.includes('edificio')) {
        return handlePropertyQueries(lowerQuery);
      }
      
      // Preguntas sobre inquilinos
      if (lowerQuery.includes('inquilino') || lowerQuery.includes('tenant')) {
        return handleTenantQueries(lowerQuery);
      }
      
      // Preguntas sobre pagos
      if (lowerQuery.includes('pago') || lowerQuery.includes('renta') || lowerQuery.includes('dinero')) {
        return handlePaymentQueries(lowerQuery);
      }
      
      // Preguntas sobre unidades
      if (lowerQuery.includes('unidad') || lowerQuery.includes('apartamento')) {
        return handleUnitQueries(lowerQuery);
      }
      
      // Preguntas sobre mantenimiento
      if (lowerQuery.includes('mantenimiento') || lowerQuery.includes('reparación')) {
        return handleMaintenanceQueries(lowerQuery);
      }
      
      // Resumen general
      if (lowerQuery.includes('resumen') || lowerQuery.includes('estado') || lowerQuery.includes('todo')) {
        return handleGeneralSummary();
      }
      
      // Respuesta por defecto
      return generateHelpfulResponse();
      
    } catch (error) {
      console.error('Error processing query:', error);
      return "Lo siento, hubo un error procesando tu consulta. ¿Puedes intentar reformularla?";
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
        `• ${t.first_name} ${t.last_name} - €${t.monthly_rent || 0}/mes`
      ).join('\n');
      return `Inquilinos activos (${activeTenants.length}):\n${tenantList}${activeTenants.length > 5 ? '\n... y más' : ''}`;
    }
    
    if (tenants.length === 0) {
      return "Aún no tienes inquilinos registrados. ¿Te gustaría agregar tu primer inquilino?";
    }
    
    return `Tienes ${tenants.length} inquilinos registrados, ${tenants.filter(t => t.is_active).length} están activos.`;
  };

  const handlePaymentQueries = (query: string): string => {
    const { tenants, payments } = userData!;
    
    // Calcular ingresos mensuales potenciales
    const activeTenants = tenants.filter(t => t.is_active);
    const monthlyRevenue = activeTenants.reduce((sum, t) => sum + (t.monthly_rent || 0), 0);
    
    if (query.includes('ingresos') || query.includes('gano')) {
      return `Tus ingresos mensuales potenciales son €${monthlyRevenue.toLocaleString()} de ${activeTenants.length} inquilinos activos.`;
    }
    
    if (query.includes('pendientes') || query.includes('deben')) {
      // Usar localStorage para pagos pendientes (como en el tracker)
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      const storageKey = `payment_records_${user?.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(storageKey);
      
      if (storedRecords) {
        const records = JSON.parse(storedRecords);
        const currentMonthRecords = records.filter((r: any) => 
          r.year === currentYear && r.month === currentMonth && r.paid
        );
        const paidCount = currentMonthRecords.length;
        const pendingCount = activeTenants.length - paidCount;
        
        if (pendingCount > 0) {
          return `Tienes ${pendingCount} inquilinos con pagos pendientes este mes de ${activeTenants.length} totales.`;
        } else {
          return "¡Excelente! Todos tus inquilinos están al día con sus pagos este mes.";
        }
      }
      
      return `Tienes ${activeTenants.length} inquilinos activos. Revisa la tabla de seguimiento de pagos para ver el estado actual.`;
    }
    
    return `Tienes ${payments.length} registros de pagos en total. Tus ingresos mensuales potenciales son €${monthlyRevenue.toLocaleString()}.`;
  };

  const handleUnitQueries = (query: string): string => {
    const { units } = userData!;
    
    const totalUnits = units.length;
    const occupiedUnits = units.filter(u => !u.is_available).length;
    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? ((occupiedUnits / totalUnits) * 100).toFixed(1) : '0';
    
    if (query.includes('ocupación') || query.includes('ocupadas')) {
      return `Tienes ${occupiedUnits} unidades ocupadas de ${totalUnits} totales (${occupancyRate}% de ocupación).`;
    }
    
    if (query.includes('vacías') || query.includes('libres')) {
      if (vacantUnits === 0) {
        return "¡Excelente! Todas tus unidades están ocupadas.";
      }
      return `Tienes ${vacantUnits} unidades disponibles de ${totalUnits} totales.`;
    }
    
    return `Resumen de unidades: ${totalUnits} totales, ${occupiedUnits} ocupadas, ${vacantUnits} disponibles (${occupancyRate}% ocupación).`;
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

  const generateHelpfulResponse = (): string => {
    return `Puedo ayudarte con información sobre:
• **Propiedades**: "¿Cuántas propiedades tengo?" o "¿Qué unidades están vacías?"
• **Inquilinos**: "¿Cuántos inquilinos activos tengo?" o "Lista mis inquilinos"
• **Pagos**: "¿Cuáles son mis ingresos?" o "¿Quién debe pagos?"
• **Unidades**: "¿Cuál es mi tasa de ocupación?" o "¿Qué unidades están libres?"
• **Mantenimiento**: "¿Tengo solicitudes pendientes?" o "¿Hay algo urgente?"
• **Resumen**: "Dame un resumen general" o "¿Cómo está mi negocio?"

¿Qué te gustaría saber?`;
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.type === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg px-3 py-2 ${
                    message.type === 'user'
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
              onKeyPress={handleKeyPress}
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