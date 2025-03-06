
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Settings = () => {
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  
  const handleSaveGeneralSettings = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-4">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Language Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose your preferred language for the application.
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="language" className="w-full sm:w-[250px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Theme Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize your display preferences.
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="dark-mode"
                      checked={darkMode}
                      onCheckedChange={setDarkMode}
                    />
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                  </div>
                </div>
                
                <Button onClick={handleSaveGeneralSettings}>Save Changes</Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-4">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Account Settings</h3>
              <p className="text-muted-foreground">
                Account settings will be available soon.
              </p>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-4">
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  More notification options will be available soon.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </Layout>
  );
};

export default Settings;
