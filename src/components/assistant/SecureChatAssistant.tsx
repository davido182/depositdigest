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
        Promise.resolve({ data: [], error: null })
      ]);

      const data: UserData = {
        properties: propertiesRes.data || [],
        tenants: tenantsData || [],
        units: unitsRes.data || [],
        payments: paymentsRes.data || [],
        maintenance: maintenanceRes.data || []
      };

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

    try {
      // Obtener datos de la tabla de seguimiento de pagos
      const currentYear = new Date().getFullYear();
      const storageKey = `payment_records_${user?.id}_${currentYear}`;
      const storedRecords = localStorage.getItem(storageKey);
      
      let paymentRecords: any[] = [];
      if (storedRecords) {
        try {
          const allRecords = JSON.parse(storedRecords);
          paymentRecords = allRecords.filter((r: any) => 
            r.tenantId && r.tenantId !== 'N/A'
          );
          console.log('Payment records for AI:', paymentRecords.length);
        } catch (error) {
          console.error('Error parsing payment records:', error);
        }
      }

      // Llamar a la Edge Function con Cerebras AI
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          query: query,
          userData: {
            tenants: userData.tenants.map(t => ({
              name: t.name,
              status: t.status,
              unit_number: t.unit_number || t.unit,
              rent_amount: t.rent_amount || t.rentAmount,
              lease_start_date: t.lease_start_date,
              move_in_date: t.move_in_date,
              email: t.email,
              phone: t.phone
            })),
            properties: userData.properties.map(p => ({
              name: p.name,
              address: p.address,
              type: p.type,
              units_count: p.units_count
            })),
            units: userData.units.map(u => ({
              unit_number: u.unit_number,
              is_available: u.is_available,
              rent_amount: u.rent_amount
            })),
            payments: userData.payments.slice(0, 20).map(p => ({
              amount: p.amount,
              payment_date: p.payment_date,
              status: p.status,
              tenant_name: p.tenant_name
            })),
            paymentRecords: paymentRecords.map(r => {
              // Buscar el nombre del inquilino por su ID
              const tenant = userData.tenants.find(t => t.id === r.tenantId);
              return {
                tenantName: tenant?.name || 'Desconocido',
                tenantId: r.tenantId,
                month: r.month,
                year: r.year,
                paid: r.paid,
                amount: r.amount,
                paymentDate: r.paymentDate
              };
            }),
            maintenance: userData.maintenance.slice(0, 10).map(m => ({
              title: m.title,
              status: m.status,
              priority: m.priority,
              created_at: m.created_at
            }))
          }
        }
      });

      if (error) {
        console.error('Error calling AI assistant:', error);
        return "Lo siento, tuve un problema procesando tu consulta. ¿Puedes intentar de nuevo? 🤔";
      }

      return data.response || "No pude generar una respuesta. Intenta reformular tu pregunta.";
      
    } catch (error) {
      console.error('Error in processUserQuery:', error);
      return "Hubo un error al procesar tu mensaje. Por favor intenta de nuevo.";
    }
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
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    try {
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
            <div className="font-semibold">Asistente RentaFlux AI</div>
            <div className="text-xs text-white/80">Powered by Cerebras AI</div>
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
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-md">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-white flex-shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntame sobre tus inquilinos, pagos, propiedades..."
              className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              disabled={isLoading || !userData}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || !userData}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Asistente inteligente con IA • Respuestas personalizadas basadas en tus datos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
