
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export function ChatAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy tu asistente de RentFlow. Puedo ayudarte a encontrar información sobre tus inquilinos, pagos, mantenimiento y más. Pregúntame algo como "¿Cuál es el alquiler del apartamento 101?" o "¿Cuándo ingresó María González?"',
      isBot: true,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getApplicationData = () => {
    const tenants = JSON.parse(localStorage.getItem('tenants') || '[]');
    const payments = JSON.parse(localStorage.getItem('payments') || '[]');
    const maintenanceRequests = JSON.parse(localStorage.getItem('maintenance_requests') || '[]');
    
    return { tenants, payments, maintenanceRequests };
  };

  const processQuery = (query: string) => {
    const { tenants, payments, maintenanceRequests } = getApplicationData();
    const lowerQuery = query.toLowerCase();

    // Buscar por unidad específica
    const unitMatch = lowerQuery.match(/(?:unidad|apartamento|apto|unit)\s*(\d+)/);
    if (unitMatch) {
      const unitNumber = unitMatch[1];
      const tenant = tenants.find((t: any) => t.unit === unitNumber);
      if (tenant) {
        return `El inquilino de la unidad ${unitNumber} es ${tenant.name}. Ingresó el ${new Date(tenant.moveInDate).toLocaleDateString('es-ES')} y paga $${tenant.rentAmount.toLocaleString()} de alquiler.`;
      } else {
        return `No encontré información sobre la unidad ${unitNumber}.`;
      }
    }

    // Buscar por nombre de inquilino
    const tenant = tenants.find((t: any) => 
      lowerQuery.includes(t.name.toLowerCase()) || 
      t.name.toLowerCase().includes(lowerQuery.replace(/¿|quien|quién|cual|cuál|\?/g, '').trim())
    );

    if (tenant) {
      const tenantPayments = payments.filter((p: any) => p.tenantId === tenant.id);
      const lastPayment = tenantPayments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      const maintenanceCount = maintenanceRequests.filter((m: any) => m.tenantId === tenant.id).length;

      return `**${tenant.name}**
- Unidad: ${tenant.unit}
- Alquiler: $${tenant.rentAmount.toLocaleString()}
- Fecha de ingreso: ${new Date(tenant.moveInDate).toLocaleDateString('es-ES')}
- Estado: ${tenant.status === 'active' ? 'Activo' : tenant.status}
- Último pago: ${lastPayment ? new Date(lastPayment.date).toLocaleDateString('es-ES') : 'Sin pagos registrados'}
- Solicitudes de mantenimiento: ${maintenanceCount}`;
    }

    // Consultas sobre pagos
    if (lowerQuery.includes('pago') || lowerQuery.includes('cuanto pag') || lowerQuery.includes('último pago')) {
      const recentPayments = payments
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
      
      if (recentPayments.length === 0) {
        return 'No hay pagos registrados en el sistema.';
      }

      let response = 'Últimos pagos registrados:\n\n';
      recentPayments.forEach((payment: any) => {
        const tenant = tenants.find((t: any) => t.id === payment.tenantId);
        response += `• ${tenant ? tenant.name : 'Desconocido'}: $${payment.amount.toLocaleString()} (${new Date(payment.date).toLocaleDateString('es-ES')})\n`;
      });
      
      return response;
    }

    // Consultas sobre mantenimiento
    if (lowerQuery.includes('mantenimiento') || lowerQuery.includes('reparac') || lowerQuery.includes('problema')) {
      const pendingMaintenance = maintenanceRequests.filter((m: any) => m.status === 'pending');
      
      if (pendingMaintenance.length === 0) {
        return 'No hay solicitudes de mantenimiento pendientes.';
      }

      let response = `Hay ${pendingMaintenance.length} solicitudes de mantenimiento pendientes:\n\n`;
      pendingMaintenance.slice(0, 5).forEach((request: any) => {
        const tenant = tenants.find((t: any) => t.id === request.tenantId);
        response += `• Unidad ${request.unit}: ${request.title} (${tenant ? tenant.name : 'Desconocido'})\n`;
      });
      
      return response;
    }

    // Estadísticas generales
    if (lowerQuery.includes('resumen') || lowerQuery.includes('estadística') || lowerQuery.includes('total')) {
      const activeTenantsCount = tenants.filter((t: any) => t.status === 'active').length;
      const totalRent = tenants.reduce((sum: number, t: any) => sum + (t.rentAmount || 0), 0);
      const pendingMaintenanceCount = maintenanceRequests.filter((m: any) => m.status === 'pending').length;
      
      return `**Resumen del Sistema:**
- Total inquilinos activos: ${activeTenantsCount}
- Ingresos mensuales potenciales: $${totalRent.toLocaleString()}
- Solicitudes de mantenimiento pendientes: ${pendingMaintenanceCount}
- Total pagos registrados: ${payments.length}`;
    }

    return 'No pude encontrar información específica sobre tu consulta. Intenta preguntar sobre un inquilino específico, una unidad, pagos, o mantenimiento. Por ejemplo: "¿Quién vive en la unidad 101?" o "¿Cuáles son los últimos pagos?"';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isBot: false,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Procesar la consulta localmente
      const response = processQuery(inputValue);
      
      // Guardar la conversación si el usuario está autenticado
      if (user?.id) {
        await supabase.from('chat_conversations').insert({
          user_id: user.id,
          message: inputValue,
          response: response,
          context_data: getApplicationData()
        });
      }

      // Simular un pequeño delay para mejorar la experiencia
      setTimeout(() => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response,
          isBot: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error processing query:', error);
      toast.error('Error al procesar la consulta');
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
          Asistente de Consultas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-4 pr-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                {message.isBot && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                    message.isBot
                      ? 'bg-muted text-foreground'
                      : 'bg-primary text-primary-foreground ml-auto'
                  }`}
                >
                  {message.text}
                </div>
                {!message.isBot && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Pregúntame sobre inquilinos, pagos, mantenimiento..."
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
      </CardContent>
    </Card>
  );
}
