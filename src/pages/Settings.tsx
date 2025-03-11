import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { useDeviceFeatures } from "@/hooks/use-device-features";
import { MobileFeatureToggle } from "@/components/settings/MobileFeatureToggle";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Bell, Mail, MessageSquare, UserCog, Smartphone } from "lucide-react";

interface NotificationSettings {
  email: boolean;
  sms: boolean;
  appNotifications: boolean;
  latePayments: boolean;
  maintenanceUpdates: boolean;
  leaseRenewals: boolean;
  moveIns: boolean;
  moveOuts: boolean;
}

const Settings = () => {
  const { isNative } = useDeviceFeatures();
  
  const [language, setLanguage] = useState("en");
  const [darkMode, setDarkMode] = useState(false);
  const [timezone, setTimezone] = useState("America/New_York");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email: true,
    sms: false,
    appNotifications: true,
    latePayments: true,
    maintenanceUpdates: true,
    leaseRenewals: true,
    moveIns: true,
    moveOuts: true,
  });

  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("admin@example.com");
  
  const handleSaveGeneralSettings = () => {
    toast.success("General settings saved successfully");
  };
  
  const handleSaveNotificationSettings = () => {
    if (notifications.sms && !phoneNumber) {
      toast.error("Please add a phone number for SMS notifications");
      return;
    }
    
    toast.success("Notification preferences saved successfully");
  };
  
  const handleSaveAccountSettings = () => {
    toast.success("Account information updated successfully");
  };
  
  const toggleNotification = (key: keyof NotificationSettings) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  return (
    <Layout>
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        
        <Tabs defaultValue="general">
          <TabsList className="w-full max-w-md overflow-x-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            {isNative && <TabsTrigger value="mobile">Mobile</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="general" className="mt-4">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Display Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Customize your app appearance and preferences.
                  </p>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger id="timezone">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Format Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose how dates and numbers are displayed.
                  </p>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format</Label>
                      <Select value={dateFormat} onValueChange={setDateFormat}>
                        <SelectTrigger id="dateFormat">
                          <SelectValue placeholder="Select date format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        id="dark-mode"
                        checked={darkMode}
                        onCheckedChange={setDarkMode}
                      />
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleSaveGeneralSettings}>Save Changes</Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-4">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Notification Methods</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose how you want to be notified about important events.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="email-notifications" className="cursor-pointer">Email Notifications</Label>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={notifications.email}
                        onCheckedChange={() => toggleNotification('email')}
                      />
                    </div>
                    
                    {notifications.email && (
                      <div className="ml-6 pl-2 border-l border-muted">
                        <div className="space-y-2">
                          <Label htmlFor="email-address">Email Address</Label>
                          <Input
                            id="email-address"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email address"
                            className="max-w-md"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="sms-notifications" className="cursor-pointer">SMS Notifications</Label>
                      </div>
                      <Switch
                        id="sms-notifications"
                        checked={notifications.sms}
                        onCheckedChange={() => toggleNotification('sms')}
                      />
                    </div>
                    
                    {notifications.sms && (
                      <div className="ml-6 pl-2 border-l border-muted">
                        <div className="space-y-2">
                          <Label htmlFor="phone-number">Phone Number</Label>
                          <Input
                            id="phone-number"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Your phone number"
                            className="max-w-md"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="app-notifications" className="cursor-pointer">In-App Notifications</Label>
                      </div>
                      <Switch
                        id="app-notifications"
                        checked={notifications.appNotifications}
                        onCheckedChange={() => toggleNotification('appNotifications')}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Notification Events</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select the events you want to be notified about.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="late-payments" className="cursor-pointer">Late Payments</Label>
                      <Switch
                        id="late-payments"
                        checked={notifications.latePayments}
                        onCheckedChange={() => toggleNotification('latePayments')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="maintenance-updates" className="cursor-pointer">Maintenance Updates</Label>
                      <Switch
                        id="maintenance-updates"
                        checked={notifications.maintenanceUpdates}
                        onCheckedChange={() => toggleNotification('maintenanceUpdates')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lease-renewals" className="cursor-pointer">Lease Renewals</Label>
                      <Switch
                        id="lease-renewals"
                        checked={notifications.leaseRenewals}
                        onCheckedChange={() => toggleNotification('leaseRenewals')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="move-ins" className="cursor-pointer">Move-Ins</Label>
                      <Switch
                        id="move-ins"
                        checked={notifications.moveIns}
                        onCheckedChange={() => toggleNotification('moveIns')}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="move-outs" className="cursor-pointer">Move-Outs</Label>
                      <Switch
                        id="move-outs"
                        checked={notifications.moveOuts}
                        onCheckedChange={() => toggleNotification('moveOuts')}
                      />
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleSaveNotificationSettings}>Save Notification Preferences</Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="account" className="mt-4">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Account Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update your account details and preferences.
                  </p>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="John Doe" defaultValue="Property Manager" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" defaultValue={email} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" placeholder="Your company name" defaultValue="ABC Properties" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" placeholder="Your phone number" defaultValue={phoneNumber || "(123) 456-7890"} />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Security</h3>
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    
                    <div></div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleSaveAccountSettings}>Save Account Changes</Button>
              </div>
            </Card>
          </TabsContent>
          
          {isNative && (
            <TabsContent value="mobile" className="mt-4">
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Mobile Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure your mobile app experience
                    </p>
                    
                    <MobileFeatureToggle />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium">Sync Settings</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Control how data syncs between your device and the cloud
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-sync" className="cursor-pointer">Auto Sync</Label>
                        <Switch
                          id="auto-sync"
                          defaultChecked={true}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sync-on-wifi" className="cursor-pointer">Only Sync on WiFi</Label>
                        <Switch
                          id="sync-on-wifi"
                          defaultChecked={true}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="background-sync" className="cursor-pointer">Background Sync</Label>
                        <Switch
                          id="background-sync"
                          defaultChecked={false}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Label htmlFor="sync-frequency">Sync Frequency</Label>
                      <Select defaultValue="15">
                        <SelectTrigger id="sync-frequency" className="mt-1">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Every 5 minutes</SelectItem>
                          <SelectItem value="15">Every 15 minutes</SelectItem>
                          <SelectItem value="30">Every 30 minutes</SelectItem>
                          <SelectItem value="60">Every hour</SelectItem>
                          <SelectItem value="manual">Manual only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button onClick={() => toast.success("Mobile settings saved")}>
                    Save Mobile Settings
                  </Button>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </section>
    </Layout>
  );
};

export default Settings;
