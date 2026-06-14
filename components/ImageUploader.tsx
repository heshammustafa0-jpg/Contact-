"use client";

import { useCallback, useRef, useState } from "react";

interface UploadedImage {
  file: File;
  preview: string;
  base64: string;
  type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

interface ImageUploaderProps {
  label: string;
  image: UploadedImage | null;
  onImageChange: (image: UploadedImage | null) => void;
  toyName: string;
  onToyNameChange: (name: string) => void;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_MB = 10;

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX_DIM = 1200;
      let { width, height } = img;

      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function ImageUploader({
  label,
  image,
  onImageChange,
  toyName,
  onToyNameChange,
}: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError("");

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("صيغة غير مدعومة. يُرجى رفع صورة JPG أو PNG أو WEBP.");
        return;
      }

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`حجم الصورة يتجاوز ${MAX_SIZE_MB} ميجابايت.`);
        return;
      }

      const preview = URL.createObjectURL(file);
      const base64 = await compressImage(file);

      onImageChange({
        file,
        preview,
        base64,
        type: "image/jpeg",
      });
    },
    [onImageChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    if (image?.preview) URL.revokeObjectURL(image.preview);
    onImageChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-semibold text-montessori-green">
        {label}
      </label>

      {image ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-montessori-green bg-montessori-cream shadow-sm">
          <img
            src={image.preview}
            alt={label}
            className="w-full h-48 object-contain bg-gray-50"
          />
          <button
            onClick={handleRemove}
            className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold hover:bg-red-600 transition-colors shadow-md"
            title="إزالة الصورة"
          >
            ✕
          </button>
          <div className="p-2 text-xs text-center text-gray-500">
            {image.file.name}
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          className={`relative border-2 border-dashed rounded-xl h-48 flex flex-col items-center justify-center cursor-pointer transition-all
            ${
              dragging
                ? "border-montessori-gold bg-amber-50 scale-[1.02]"
                : "border-montessori-green hover:border-montessori-gold hover:bg-montessori-cream"
            }`}
        >
          <div className="text-5xl mb-3 select-none">🖼️</div>
          <p className="text-sm font-medium text-montessori-green">
            اسحب الصورة هنا أو انقر للاختيار
          </p>
          <p className="text-xs text-gray-400 mt-1">
            JPG, PNG, WEBP — حتى {MAX_SIZE_MB} ميجابايت
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          ⚠️ {error}
        </p>
      )}

      <input
        type="text"
        placeholder="اسم اللعبة (اختياري)"
        value={toyName}
        onChange={(e) => onToyNameChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-montessori-green focus:border-transparent transition-all placeholder:text-gray-400 text-right"
        dir="rtl"
      />
    </div>
  );
}
