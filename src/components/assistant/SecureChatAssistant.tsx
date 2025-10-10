import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export function SecureChatAssistant() {
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Asistente RentaFlux
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Asistente Temporalmente Deshabilitado</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              El asistente de IA está siendo mejorado para ofrecerte una mejor experiencia. 
              Estará disponible nuevamente pronto.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}