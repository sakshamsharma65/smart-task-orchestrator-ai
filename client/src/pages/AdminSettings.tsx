
import React, { useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import DepartmentsManager from "@/components/settings/DepartmentsManager";
import OfficeLocationsManager from "@/components/settings/OfficeLocationsManager";
import StatusManager from "@/components/settings/StatusManager";
import GeneralSettings from "@/components/settings/GeneralSettings";
import EmailManager from "@/components/settings/EmailManager";
import Notificationsettings from "@/components/settings/Notificationsettings";
import { LicenseManager } from "@/components/settings/LicenseManager";
import GlobalTodoSettings from "@/components/settings/GlobalTodoSettings";

const AdminSettings: React.FC = () => {
  const [tab, setTab] = useState("general");

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full max-w-none px-6 py-6">
        <h2 className="text-2xl font-semibold mb-6 text-left">Settings</h2>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full max-w-none flex flex-row bg-background border rounded-md mb-6 p-0 gap-2 justify-start">
            <TabsTrigger
              value="general"
              className="px-6 py-3 text-left justify-start"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="px-6 py-3 text-left justify-start"
            >
              Departments
            </TabsTrigger>
            <TabsTrigger
              value="office-locations"
              className="px-6 py-3 text-left justify-start"
            >
              Office Locations
            </TabsTrigger>
            <TabsTrigger
              value="statuses"
              className="px-6 py-3 text-left justify-start"
            >
              Task Statuses
            </TabsTrigger>
            <TabsTrigger
              value="license"
              className="px-6 py-3 text-left justify-start"
            >
              License Manager
            </TabsTrigger>
             <TabsTrigger
              value="email"
              className="px-6 py-3 text-left justify-start"
            >
             Email Configuration
            </TabsTrigger>
               <TabsTrigger
              value="notifications"
              className="px-6 py-3 text-left justify-start"
            >
            Notification Settings
            </TabsTrigger>
            <TabsTrigger value="Todos" className="px-6 py-3 text-left justify-start">
              Todos
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="w-full">
            <GeneralSettings />
          </TabsContent>
          <TabsContent value="departments" className="w-full">
            <DepartmentsManager />
          </TabsContent>
          <TabsContent value="office-locations" className="w-full">
            <OfficeLocationsManager />
          </TabsContent>
          <TabsContent value="statuses" className="w-full">
            <StatusManager />
          </TabsContent>
          <TabsContent value="email" className="w-full">
  <EmailManager />
</TabsContent>
          <TabsContent value="notifications" className="w-full">
            <Notificationsettings />
          </TabsContent>  
<TabsContent value="Todos" className="w-full">
            <GlobalTodoSettings />
          </TabsContent>  

          <TabsContent value="license" className="w-full">
            <LicenseManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminSettings;
