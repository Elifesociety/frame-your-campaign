import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface PhotoUploaderProps {
  onPhotoSelect: (file: File) => void;
}

export const PhotoUploader = ({ onPhotoSelect }: PhotoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onPhotoSelect(file);
    } else {
      toast.error("Please upload an image file");
    }
  }, [onPhotoSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoSelect(file);
    }
  }, [onPhotoSelect]);

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 ${
        isDragging ? "border-primary shadow-[var(--shadow-card)] scale-[1.02]" : "border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <label className="cursor-pointer block p-12">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
        
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-6">
            {isDragging ? (
              <ImageIcon className="h-12 w-12 text-primary animate-bounce" />
            ) : (
              <Upload className="h-12 w-12 text-primary" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">
              {isDragging ? "Drop your photo here" : "ഫോട്ടോ ചേർക്കാൻ ഇവിടെ ക്ലിക്ക് ചെയ്യുക "}
            </h3>
            <p className="text-muted-foreground">
              Drag and drop or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Supports JPG, PNG, WEBP
            </p>
          </div>
        </div>
      </label>
    </Card>
  );
};
