import React from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Switch } from "../components/ui/primitives";
import { useTheme } from "next-themes";

export default function Settings() {
  const { setTheme } = useTheme();
  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Settings</h1>
      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setTheme("light")}>Light</Button>
            <Button variant="outline" onClick={() => setTheme("dark")}>Dark</Button>
            <Button variant="outline" onClick={() => setTheme("system")}>System</Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center"><span>Email Notifications</span><Switch /></div>
          <div className="flex justify-between items-center"><span>Push Notifications</span><Switch /></div>
        </CardContent>
      </Card>
    </div>
  );
}