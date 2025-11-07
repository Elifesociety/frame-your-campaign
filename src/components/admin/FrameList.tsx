import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Eye, EyeOff } from "lucide-react";

interface Frame {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

export function FrameList() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFrames();
  }, []);

  const fetchFrames = async () => {
    try {
      const { data, error } = await supabase
        .from('frames')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFrames(data || []);
    } catch (error: any) {
      toast.error("Error loading frames");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('frames')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Frame ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchFrames();
    } catch (error: any) {
      toast.error("Error updating frame");
    }
  };

  const deleteFrame = async (id: string, imageUrl: string) => {
    if (!confirm('Are you sure you want to delete this frame?')) return;

    try {
      // Extract file path from URL
      const path = imageUrl.split('/frames/')[1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('frames')
        .remove([path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('frames')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      toast.success("Frame deleted successfully");
      fetchFrames();
    } catch (error: any) {
      toast.error("Error deleting frame");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading frames...</div>;
  }

  if (frames.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-center text-muted-foreground">No frames uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Uploaded Frames</h2>
      
      <div className="grid gap-4">
        {frames.map((frame) => (
          <div
            key={frame.id}
            className="flex items-center gap-4 p-4 border border-border rounded-lg"
          >
            <img
              src={frame.image_url}
              alt={frame.name}
              className="w-24 h-24 object-cover rounded"
            />
            
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{frame.name}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(frame.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm">
                <span className={frame.is_active ? "text-green-600" : "text-muted-foreground"}>
                  {frame.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleActive(frame.id, frame.is_active)}
              >
                {frame.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteFrame(frame.id, frame.image_url)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
