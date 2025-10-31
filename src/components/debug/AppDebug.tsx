import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function AppDebug() {
  const { user, userRole, isAuthenticated, isLoading: authLoading } = useAuth();
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkEverything = async () => {
    if (!user) return;
    
    setIsLoading(true);
    const debug: any = {
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        role: userRole,
        isAuthenticated,
        authLoading
      },
      tables: {}
    };

    try {
      // Verificar todas las tablas principales
      const tables = ['tenants', 'properties', 'payments', 'maintenance_requests', 'user_roles'];
      
      for (const tableName of tables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

          debug.tables[tableName] = {
            error: error?.message || null,
            columns: data && data.length > 0 ? Object.keys(data[0]) : 'No data',
            sampleData: data?.[0] || 'No data',
            count: data?.length || 0
          };
        } catch (tableError) {
          debug.tables[tableName] = {
            error: `Exception: ${tableError instanceof Error ? tableError.message : 'Unknown'}`,
            columns: 'Error',
            sampleData: 'Error',
            count: 0
          };
        }
      }

      // Verificar configuración de la app
      debug.app = {
        currentUrl: window.location.href,
        userAgent: navigator.userAgent,
        localStorage: {
          seen_notifications: localStorage.getItem('seen_notifications'),
          rentaflux_has_visited: localStorage.getItem('rentaflux_has_visited')
        }
      };

      setResults(debug);
    } catch (error) {
      console.error('Error in full debug:', error);
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>🔍 Debug Completo de RentaFlux</CardTitle>
        <CardDescription>
          Verificar estado completo de la aplicación y base de datos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={checkEverything} disabled={isLoading || !user}>
          {isLoading ? 'Verificando...' : 'Debug Completo'}
        </Button>

        {results && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Usuario</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(results.user, null, 2)}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">App Info</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(results.app, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tablas de Base de Datos</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-96">
                  {JSON.stringify(results.tables, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
