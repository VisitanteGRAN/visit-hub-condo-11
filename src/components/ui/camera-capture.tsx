import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, RotateCcw, Check, X, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  title?: string;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ 
  onCapture, 
  onClose, 
  title = "Tirar Foto" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Câmera frontal preferível para selfies
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setHasCamera(true);
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setHasCamera(false);
      toast.error('Não foi possível acessar a câmera. Use o upload de arquivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para detectar rosto (simulada - pode integrar com face-api.js)
  const detectFace = (imageData: string): boolean => {
    // Simulação de detecção de rosto
    // Em produção, usar bibliotecas como face-api.js
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Área de vídeo/foto */}
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
              {capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Foto capturada" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  {hasCamera ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Camera className="w-12 h-12 mx-auto mb-2" />
                        <p>Câmera não disponível</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay para guia do rosto */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-60 border-2 border-white border-dashed rounded-lg flex items-center justify-center">
                      <div className="text-white text-center">
                        <Camera className="w-6 h-6 mx-auto mb-1" />
                        <p className="text-xs">Posicione seu rosto</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Canvas oculto para captura */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Input de arquivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Controles */}
            <div className="flex gap-2">
              {capturedImage ? (
                <>
                  <Button variant="outline" onClick={retakePhoto} className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Tirar Novamente
                  </Button>
                  <Button onClick={confirmPhoto} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar
                  </Button>
                </>
              ) : (
                <>
                  {hasCamera && (
                    <Button 
                      onClick={capturePhoto} 
                      disabled={isLoading}
                      className="flex-1"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Capturar
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </>
              )}
            </div>

            {/* Dicas */}
            <div className="text-xs text-gray-600 text-center">
              <p>📸 Mantenha o rosto bem iluminado</p>
              <p>👀 Olhe diretamente para a câmera</p>
              <p>🚫 Evite óculos escuros ou chapéus</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 