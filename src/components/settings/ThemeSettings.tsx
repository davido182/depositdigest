
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moon, Sun, Monitor } from "lucide-react";
import { toast } from "sonner";

export function ThemeSettings() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('app-theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'system') {
      // Check system preference
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      root.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    applyTheme(newTheme);
    
    const themeNames = {
      light: "Light Mode",
      dark: "Dark Mode", 
      system: "System Theme"
    };
    
    toast.success(`Theme changed to ${themeNames[newTheme as keyof typeof themeNames]}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sun className="h-5 w-5" />
          Theme Settings
        </CardTitle>
        <CardDescription>
          Choose your preferred theme for the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={theme} onValueChange={handleThemeChange}>
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="light" id="light" />
            <Sun className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="light" className="flex-1 cursor-pointer">
              <div className="font-medium">Light Mode</div>
              <div className="text-sm text-muted-foreground">Clean, bright interface</div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="dark" id="dark" />
            <Moon className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="dark" className="flex-1 cursor-pointer">
              <div className="font-medium">Dark Mode</div>
              <div className="text-sm text-muted-foreground">Easy on the eyes in low light</div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value="system" id="system" />
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="system" className="flex-1 cursor-pointer">
              <div className="font-medium">System Theme</div>
              <div className="text-sm text-muted-foreground">Follows your device settings</div>
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
