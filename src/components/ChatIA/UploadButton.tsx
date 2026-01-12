import React, { useRef } from 'react';

interface UploadButtonProps {
  onFileSelected: (file: File) => void;
}

export default function UploadButton({ onFileSelected }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".csv,.xlsx,.xls,.json"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      <button
        className="px-3 py-2 bg-green-700 text-white rounded hover:bg-green-800"
        onClick={() => inputRef.current?.click()}
      >
        Subir datos
      </button>
    </div>
  );
}
