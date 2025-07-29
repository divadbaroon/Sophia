import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, AlertCircle } from "lucide-react";

interface CloneVoiceModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloneVoiceModal({ isOpen, onOpenChange }: CloneVoiceModalProps) {
  const [voiceName, setVoiceName] = useState("");
  const [description, setDescription] = useState("");
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length !== files.length) {
      setError('Please only upload audio files');
      return;
    }
    
    setAudioFiles(audioFiles);
    setError(null);
  };

  const removeFile = (index: number) => {
    setAudioFiles(files => files.filter((_, i) => i !== index));
  };

  const handleClone = async () => {
    if (!voiceName.trim()) {
      setError('Voice name is required');
      return;
    }

    if (audioFiles.length === 0) {
      setError('At least one audio file is required');
      return;
    }

    setIsCloning(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', voiceName);
      formData.append('description', description);
      
      audioFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await fetch('/api/elevenlabs/clone-voice', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to clone voice');
      }

      const result = await response.json();
      console.log('✅ Voice cloned successfully:', result.voice_id);
      
      // Reset form and close modal
      setVoiceName("");
      setDescription("");
      setAudioFiles([]);
      onOpenChange(false);
      
      // Show success message or refresh agent config
      alert(`Voice "${voiceName}" cloned successfully! Voice ID: ${result.voice_id}`);

    } catch (error) {
      console.error('❌ Error cloning voice:', error);
      setError(error instanceof Error ? error.message : 'Failed to clone voice');
    } finally {
      setIsCloning(false);
    }
  };

  const handleCancel = () => {
    setVoiceName("");
    setDescription("");
    setAudioFiles([]);
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clone Voice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Voice Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Voice Name *
            </label>
            <Input
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Enter a name for the cloned voice"
              className="text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Description (Optional)
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the voice characteristics"
              className="text-sm"
              rows={3}
            />
          </div>

          {/* Audio Files */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Audio Samples *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload audio files for voice cloning
              </p>
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                id="audio-upload"
              />
              <Button
                onClick={() => document.getElementById('audio-upload')?.click()}
                variant="outline"
                size="sm"
              >
                Choose Audio Files
              </Button>
            </div>
            
            {/* File List */}
            {audioFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">Uploaded Files:</p>
                {audioFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      onClick={() => removeFile(index)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
              <p>• Upload 1-25 audio files (MP3, WAV, etc.)</p>
              <p>• Each file should be 1-10 minutes long</p>
              <p>• Clear speech with minimal background noise works best</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isCloning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClone}
              disabled={isCloning || !voiceName.trim() || audioFiles.length === 0}
              className="flex items-center gap-2"
            >
              {isCloning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Cloning...
                </>
              ) : (
                'Clone Voice'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}