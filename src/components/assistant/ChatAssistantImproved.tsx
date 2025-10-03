import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
    id: string;
    text: string;
    isBot: boolean;
    timestamp: Date;
    type?: 'info' | 'warning' | 'success' | 'analysis';
}

export function ChatAssistantImproved() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: '¡Hola! Soy tu Consultor Inteligente de RentaFlux 🏠✨\n\nPuedo ayudarte con análisis avanzados y sugerencias personalizadas para optimizar tus propiedades. Mis especialidades incluyen:\n\n🔍 **Análisis de Datos:**\n• Rentabilidad por unidad\n• Tendencias de pagos\n• Estadísticas de ocupación\n\n💡 **Sugerencias Inteligentes:**\n• Optimización de precios\n• Estrategias anti-vacantes\n• Predicción de mantenimiento\n\n📊 **Reportes Personalizados:**\n• Comparativas entre propiedades\n• Análisis de inquilinos\n• Proyecciones financieras\n\n¿En qué te puedo ayudar hoy?',
            isBot: true,
            timestamp: new Date(),
            type: 'info'
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Sugerencias inteligentes categorizadas
    const smartSuggestions = {
        analysis: [
            "¿Cuál es mi unidad más rentable?",
            "¿Cuál es mi ingreso mensual total?",
            "¿Qué inquilinos son mis mejores pagadores?",
            "¿Cuáles son mis costos de mantenimiento?"
        ],
        alerts: [
            "¿Qué inquilinos tienen pagos atrasados?",
            "¿Qué contratos vencen pronto?",
            "¿Qué mantenimientos están pendientes?",
            "¿Hay problemas recurrentes?"
        ],
        optimization: [
            "¿Cómo puedo optimizar mis precios?",
            "¿Qué mejoras debo priorizar?",
            "¿Cómo reducir la rotación de inquilinos?",
            "¿Qué estrategias me recomiendas?"
        ]
    };

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

    const getApplicationData = async () => {
        if (!user) {
            return { tenants: [], payments: [], maintenanceRequests: [] };
        }

        try {
            console.log('Fetching data for assistant...');

            // Fetch tenants
            const { data: tenantsData, error: tenantsError } = await supabase
                .from('tenants')
                .select('*');

            if (tenantsError) {
                console.error('Error fetching tenants:', tenantsError);
            }

            // Fetch payments
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payments')
                .select('*, tenants!inner(name)');

            if (paymentsError) {
                console.error('Error fetching payments:', paymentsError);
            }

            // Fetch maintenance requests
            const { data: maintenanceData, error: maintenanceError } = await supabase
                .from('maintenance_requests')
                .select('*, tenants!inner(name)');

            if (maintenanceError) {
                console.error('Error fetching maintenance:', maintenanceError);
            }

            return {
                tenants: tenantsData || [],
                payments: paymentsData || [],
                maintenanceRequests: maintenanceData || []
            };
        } catch (error) {
            console.error('Error fetching data for assistant:', error);
            return { tenants: [], payments: [], maintenanceRequests: [] };
        }
    };

    const processAdvancedQuery = async (query: string) => {
        const { tenants, payments, maintenanceRequests } = await getApplicationData();
        const lowerQuery = query.toLowerCase();

        // Análisis de rentabilidad avanzado
        if (lowerQuery.includes('rentable') || lowerQuery.includes('más rentable') || lowerQuery.includes('mejor unidad')) {
            const tenantsWithData = tenants.map((tenant: any) => {
                const tenantPayments = payments.filter((p: any) => p.tenant_id === tenant.id);
                const totalPaid = tenantPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                const maintenanceCost = maintenanceRequests
                    .filter((m: any) => m.tenant_id === tenant.id && m.status === 'completed')
                    .length * 500;

                return {
                    ...tenant,
                    totalPaid,
                    maintenanceCost,
                    netProfit: totalPaid - maintenanceCost,
                    profitability: totalPaid > 0 ? ((totalPaid - maintenanceCost) / totalPaid * 100) : 0
                };
            }).sort((a, b) => b.netProfit - a.netProfit);

            if (tenantsWithData.length === 0) {
                return { text: 'No hay datos suficientes para calcular rentabilidad.', type: 'warning' };
            }

            const best = tenantsWithData[0];
            const worst = tenantsWithData[tenantsWithData.length - 1];

            return {
                text: `🏆 **Análisis de Rentabilidad**\n\n` +
                    `**🥇 Unidad más rentable: ${best.unit_number}**\n` +
                    `👤 Inquilino: ${best.name}\n` +
                    `💰 Ingresos: $${best.totalPaid.toLocaleString()}\n` +
                    `🔧 Mantenimiento: $${best.maintenanceCost.toLocaleString()}\n` +
                    `📈 Ganancia neta: $${best.netProfit.toLocaleString()}\n` +
                    `📊 Rentabilidad: ${best.profitability.toFixed(1)}%\n\n` +
                    `**📉 Unidad menos rentable: ${worst.unit_number}**\n` +
                    `📊 Rentabilidad: ${worst.profitability.toFixed(1)}%\n\n` +
                    `💡 **Recomendación:** Considera revisar el precio de la unidad ${worst.unit_number} o reducir costos de mantenimiento.`,
                type: 'analysis'
            };
        }

        // Análisis de pagos atrasados
        if (lowerQuery.includes('atrasado') || lowerQuery.includes('moroso') || lowerQuery.includes('debe')) {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const tenantsWithPaymentStatus = tenants.map((tenant: any) => {
                const currentMonthPayments = payments.filter((p: any) => {
                    const paymentDate = new Date(p.payment_date);
                    return p.tenant_id === tenant.id &&
                        paymentDate.getMonth() === currentMonth &&
                        paymentDate.getFullYear() === currentYear;
                });

                const hasPaidThisMonth = currentMonthPayments.length > 0;
                const totalPaid = currentMonthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                const expectedAmount = Number(tenant.rent_amount);

                return {
                    ...tenant,
                    hasPaidThisMonth,
                    totalPaid,
                    expectedAmount,
                    debt: expectedAmount - totalPaid,
                    isLate: !hasPaidThisMonth || totalPaid < expectedAmount
                };
            }).filter(t => t.isLate && t.status === 'active');

            if (tenantsWithPaymentStatus.length === 0) {
                return { text: '🎉 ¡Excelente! Todos los inquilinos están al día con sus pagos.', type: 'success' };
            }

            const totalDebt = tenantsWithPaymentStatus.reduce((sum, t) => sum + t.debt, 0);

            let response = `⚠️ **Pagos Atrasados (${tenantsWithPaymentStatus.length} inquilinos)**\n\n`;
            response += `💰 **Deuda total:** $${totalDebt.toLocaleString()}\n\n`;

            tenantsWithPaymentStatus.forEach((tenant: any) => {
                response += `🏠 **${tenant.name}** (Unidad ${tenant.unit_number})\n`;
                response += `   💸 Debe: $${tenant.debt.toLocaleString()}\n`;
                response += `   📅 Alquiler: $${tenant.expectedAmount.toLocaleString()}\n\n`;
            });

            response += `💡 **Recomendación:** Contacta a estos inquilinos para establecer un plan de pago.`;

            return { text: response, type: 'warning' };
        }

        // Análisis de ingresos
        if (lowerQuery.includes('ingreso') || lowerQuery.includes('total') || lowerQuery.includes('cuanto gano')) {
            const currentDate = new Date();
            const currentMonth = currentDate.getMonth();
            const currentYear = currentDate.getFullYear();

            const thisMonthPayments = payments.filter((p: any) => {
                const paymentDate = new Date(p.payment_date);
                return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            });

            const lastMonthPayments = payments.filter((p: any) => {
                const paymentDate = new Date(p.payment_date);
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === lastMonthYear;
            });

            const thisMonthTotal = thisMonthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const lastMonthTotal = lastMonthPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            const expectedMonthly = tenants.reduce((sum: number, t: any) => sum + Number(t.rent_amount || 0), 0);

            const growth = lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100) : 0;
            const collectionRate = expectedMonthly > 0 ? (thisMonthTotal / expectedMonthly * 100) : 0;

            return {
                text: `💰 **Análisis de Ingresos**\n\n` +
                    `📊 **Este mes:** $${thisMonthTotal.toLocaleString()}\n` +
                    `📈 **Mes anterior:** $${lastMonthTotal.toLocaleString()}\n` +
                    `🎯 **Esperado:** $${expectedMonthly.toLocaleString()}\n\n` +
                    `📈 **Crecimiento:** ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%\n` +
                    `🎯 **Tasa de cobro:** ${collectionRate.toFixed(1)}%\n\n` +
                    `${collectionRate >= 95 ? '🎉 ¡Excelente tasa de cobro!' :
                        collectionRate >= 80 ? '👍 Buena tasa de cobro' :
                            '⚠️ Tasa de cobro baja, revisa pagos atrasados'}`,
                type: collectionRate >= 90 ? 'success' : collectionRate >= 70 ? 'info' : 'warning'
            };
        }

        // Respuesta por defecto
        return {
            text: 'No pude encontrar información específica sobre tu consulta. Intenta preguntar sobre:\n\n• Rentabilidad de unidades\n• Pagos atrasados\n• Ingresos mensuales\n• Análisis de inquilinos\n• Mantenimiento pendiente',
            type: 'info'
        };
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
        setShowSuggestions(false);

        try {
            const result = await processAdvancedQuery(inputValue);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: result.text,
                isBot: true,
                timestamp: new Date(),
                type: result.type || 'info'
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error('Error processing query:', error);
            toast.error('Error al procesar la consulta');

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta de nuevo.',
                isBot: true,
                timestamp: new Date(),
                type: 'warning'
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

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);
    };

    const getMessageIcon = (type?: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case 'success': return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'analysis': return <TrendingUp className="h-4 w-4 text-blue-500" />;
            default: return <Bot className="h-4 w-4 text-primary" />;
        }
    };

    return (
        <Card className="h-[700px] flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    RentFlux Assistant Pro
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">AI</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <ScrollArea className="flex-1 max-h-[450px]" ref={scrollAreaRef}>
                    <div className="space-y-4 pr-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.isBot ? 'justify-start' : 'justify-end'}`}
                            >
                                {message.isBot && (
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                        {getMessageIcon(message.type)}
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] p-3 rounded-lg whitespace-pre-line ${message.isBot
                                        ? `bg-muted text-foreground ${message.type === 'warning' ? 'border-l-4 border-orange-500' :
                                            message.type === 'success' ? 'border-l-4 border-green-500' :
                                                message.type === 'analysis' ? 'border-l-4 border-blue-500' : ''
                                        }`
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

                {/* Sugerencias categorizadas */}
                {showSuggestions && messages.length <= 1 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            <p className="text-sm text-muted-foreground font-medium">Sugerencias inteligentes:</p>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">📊 Análisis</p>
                                <div className="grid grid-cols-1 gap-1">
                                    {smartSuggestions.analysis.slice(0, 2).map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="justify-start text-left h-auto py-2 px-3 whitespace-normal text-xs"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-muted-foreground mb-1">⚠️ Alertas</p>
                                <div className="grid grid-cols-1 gap-1">
                                    {smartSuggestions.alerts.slice(0, 2).map((suggestion, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="justify-start text-left h-auto py-2 px-3 whitespace-normal text-xs"
                                            onClick={() => handleSuggestionClick(suggestion)}
                                        >
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSuggestions(false)}
                            className="text-xs text-muted-foreground"
                        >
                            Ocultar sugerencias
                        </Button>
                    </div>
                )}

                <div className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            if (e.target.value.trim()) {
                                setShowSuggestions(false);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Pregúntame sobre rentabilidad, pagos, inquilinos..."
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

                {/* Botón para mostrar más sugerencias */}
                {!showSuggestions && messages.length <= 3 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSuggestions(true)}
                        className="text-xs text-muted-foreground self-start flex items-center gap-1"
                    >
                        <Lightbulb className="h-3 w-3" />
                        Ver sugerencias inteligentes
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}