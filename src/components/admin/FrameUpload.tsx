import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface FrameUploadProps {
  onUploadSuccess: () => void;
}

export function FrameUpload({ onUploadSuccess }: FrameUploadProps) {
  const [frameName, setFrameName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !frameName) {
      toast.error("Please provide both a name and an image");
      return;
    }

    setUploading(true);

    try {
      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('frames')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('frames')
        .getPublicUrl(filePath);

      // Save to database
      const { error: dbError } = await supabase
        .from('frames')
        .insert({
          name: frameName,
          image_url: publicUrl,
          is_active: true
        });

      if (dbError) throw dbError;

      toast.success("Frame uploaded successfully");
      setFrameName("");
      setFile(null);
      setPreview(null);
      onUploadSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error uploading frame");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Upload New Frame</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <Label htmlFor="frameName">Frame Name</Label>
          <Input
            id="frameName"
            type="text"
            value={frameName}
            onChange={(e) => setFrameName(e.target.value)}
            placeholder="e.g., Campaign Frame 2024"
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="frameImage">Frame Image</Label>
          <Input
            id="frameImage"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="mt-1"
          />
        </div>

        {preview && (
          <div className="mt-4">
            <Label>Preview</Label>
            <img
              src={preview}
              alt="Frame preview"
              className="mt-2 max-w-md rounded-lg border border-border"
            />
          </div>
        )}

        <Button type="submit" disabled={uploading} className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Frame"}
        </Button>
      </form>
    </div>
  );
}
