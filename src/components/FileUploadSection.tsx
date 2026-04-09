import React, { useRef, useState } from 'react';

interface FileUploadSectionProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({ onFileUpload, isProcessing }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/ogg', 'audio/webm'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.some(type => file.type.includes(type.split('/')[1]))) {
      setError('Invalid file type! Use MP3, WAV, M4A, or OGG files.');
      return;
    }

    if (file.size > maxSize) {
      setError('File too large! Maximum size is 50MB.');
      return;
    }

    setError('');
    setUploadedFile(file);
    onFileUpload(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div className="punk-card">
      <h3 className="text-xl font-bold mb-4 text-center">DROP YOUR AUDIO</h3>
      <div
        ref={dropZoneRef}
        className={`punk-dropzone p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragOver ? 'dragover' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <p className="font-bold">Drag & drop audio files</p>
          <p className="text-sm text-muted-foreground">or click to browse</p>
          <p className="text-xs text-muted-foreground">MP3, WAV, M4A, OGG (max 50MB)</p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {uploadedFile && (
        <div className="mt-4 p-3 bg-background-secondary rounded text-sm">
          <strong>File:</strong> {uploadedFile.name}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploadSection;