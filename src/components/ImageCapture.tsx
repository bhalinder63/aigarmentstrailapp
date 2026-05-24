"use client";

import { useRef, useState, useCallback } from "react";

interface ImageCaptureProps {
  label: string;
  hint: string;
  icon: React.ReactNode;
  onCapture: (dataUrl: string) => void;
  preview: string | null;
}

export default function ImageCapture({
  label,
  hint,
  icon,
  onCapture,
  preview,
}: ImageCaptureProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const openCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      setCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch {
      alert("Camera access denied. Please upload an image instead.");
    }
  }, []);

  const closeCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
    setCameraOpen(false);
  }, [stream]);

  const captureFromCamera = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
    closeCamera();
  }, [onCapture, closeCamera]);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => onCapture(reader.result as string);
      reader.readAsDataURL(file);
      e.target.value = "";
    },
    [onCapture]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
        {label}
      </div>

      {/* Preview or placeholder */}
      <div
        className="relative w-full rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center"
        style={{ aspectRatio: "3/4" }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onCapture("")}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full w-7 h-7 flex items-center justify-center text-slate-500 shadow text-xs font-bold"
              title="Remove image"
            >
              ✕
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-slate-400">
            <span className="text-4xl">{icon}</span>
            <span className="text-sm text-center">{hint}</span>
          </div>
        )}
      </div>

      {/* Camera modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full"
            />
            <div className="flex gap-3 p-4">
              <button
                onClick={captureFromCamera}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 font-semibold"
              >
                Capture
              </button>
              <button
                onClick={closeCamera}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl py-3 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={openCamera}
          className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          <span>📷</span> Camera
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl py-2.5 text-sm font-medium transition-colors"
        >
          <span>📁</span> Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  );
}
