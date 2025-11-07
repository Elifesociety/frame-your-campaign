import { useEffect, useRef, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FrameEditorProps {
  photoFile: File;
  onBack: () => void;
}

export const FrameEditor = ({ photoFile, onBack }: FrameEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [finalImageUrl, setFinalImageUrl] = useState<string>("");
  const [frameUrl, setFrameUrl] = useState<string>("");

  // Fetch active frame from database
  useEffect(() => {
    const fetchFrame = async () => {
      const { data, error } = await supabase
        .from("frames")
        .select("image_url")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching frame:", error);
        toast.error("Failed to load frame");
        return;
      }

      if (data) {
        setFrameUrl(data.image_url);
      } else {
        toast.error("No active frame available. Please contact admin.");
      }
    };

    fetchFrame();
  }, []);

  useEffect(() => {
    if (!frameUrl) return;

    const processImage = async () => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      try {
        // Load user photo
        const userPhoto = await loadImage(URL.createObjectURL(photoFile));
        
        // Load frame from database
        const frame = await loadImage(frameUrl);

        // Draw user photo (fit to square)
        const scale = Math.max(size / userPhoto.width, size / userPhoto.height);
        const x = (size - userPhoto.width * scale) / 2;
        const y = (size - userPhoto.height * scale) / 2;
        
        ctx.drawImage(
          userPhoto,
          x,
          y,
          userPhoto.width * scale,
          userPhoto.height * scale
        );

        // Draw frame on top
        ctx.drawImage(frame, 0, 0, size, size);

        // Convert to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setFinalImageUrl(url);
            setIsProcessing(false);
            toast.success("Your photo is ready!");
          }
        }, "image/png");
      } catch (error) {
        console.error("Error processing image:", error);
        toast.error("Failed to process image");
        setIsProcessing(false);
      }
    };

    processImage();
  }, [photoFile, frameUrl]);

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `campaign-photo-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Photo downloaded!");
      }
    }, "image/png");
  };

  const handleWhatsAppShare = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "campaign-photo.png", { type: "image/png" });
        
        if (navigator.share) {
          navigator.share({
            files: [file],
            title: "Join the Campaign",
            text: "Check out my campaign photo! Join the movement!",
          }).catch((error) => {
            console.log("Share failed:", error);
            fallbackWhatsAppShare();
          });
        } else {
          fallbackWhatsAppShare();
        }
      }
    }, "image/png");
  };

  const fallbackWhatsAppShare = () => {
    const text = encodeURIComponent("Check out my campaign photo! Join the movement!");
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, "_blank");
    toast("Opening WhatsApp...", {
      description: "Download the photo and share it manually"
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Your Campaign Photo</h2>
          
          <div className="flex justify-center">
            <div className="relative max-w-md w-full">
              <canvas
                ref={canvasRef}
                className="w-full h-auto rounded-lg shadow-lg"
                style={{ display: isProcessing ? "none" : "block" }}
              />
              
              {isProcessing && (
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                    <p className="text-muted-foreground">Processing your photo...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              onClick={handleDownload}
              disabled={isProcessing}
              size="lg"
              variant="default"
            >
              <Download className="mr-2 h-5 w-5" />
              Download Photo
            </Button>
            
            <Button
              onClick={handleWhatsAppShare}
              disabled={isProcessing}
              size="lg"
              variant="cta"
            >
              <Share2 className="mr-2 h-5 w-5" />
              Share on WhatsApp
            </Button>
          </div>
          
          <div className="text-center pt-4">
            <Button variant="ghost" onClick={onBack}>
              Upload Different Photo
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-secondary">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Next Steps</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">1.</span>
              <span>Download your framed photo to your device</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">2.</span>
              <span>Share it on WhatsApp to spread awareness</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent font-bold">3.</span>
              <span>Set it as your profile picture or WhatsApp status</span>
            </li>
          </ul>
        </div>
      </Card>
    </div>
  );
};
