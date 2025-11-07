import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { FrameUpload } from "./FrameUpload";
import { FrameList } from "./FrameList";
import { LogOut } from "lucide-react";

export function AdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleFrameUploaded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Frame Manager</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <FrameUpload onUploadSuccess={handleFrameUploaded} />
          <FrameList key={refreshKey} />
        </div>
      </main>
    </div>
  );
}
