import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Mic, StopCircle, Upload, Loader2 } from 'lucide-react';
import { AudioRecorder } from '@/utils/RealtimeAudio';
import { Waveform } from '@/components/chat/Waveform';

const VoiceTraining: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Float32Array[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const handleStartRecording = async () => {
    try {
      const recorder = new AudioRecorder((data) => {
        setAudioChunks((prev) => [...prev, data]);
        // Calculate RMS audio level (0-1)
        const rms = Math.sqrt(data.reduce((sum, val) => sum + val * val, 0) / data.length);
        setAudioLevel(Math.min(rms * 10, 1)); // Scale and clamp to 0-1
      });
      await recorder.start();
      audioRecorderRef.current = recorder;
      setIsRecording(true);
      setAudioChunks([]);
      setAudioLevel(0);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
      setIsRecording(false);
      toast.info('Recording stopped');
    }
  };

  const handleUpload = async () => {
    if (audioChunks.length === 0) {
      toast.warning('No audio recorded to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          toast.success('Voice data uploaded successfully!');
          setAudioChunks([]);
          setAudioLevel(0);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Voice Training</h1>
      <p className="text-muted-foreground">
        Record audio samples to train and improve the AI's voice recognition and synthesis.
      </p>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="gradient-text">Record New Voice Sample</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden">
            <Waveform audioLevel={audioLevel} />
          </div>
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <Button onClick={handleStartRecording} size="lg">
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button onClick={handleStopRecording} variant="destructive" size="lg">
                <StopCircle className="w-5 h-5 mr-2" />
                Stop Recording
              </Button>
            )}
          </div>
          {audioChunks.length > 0 && !isRecording && (
            <div className="w-full pt-4">
              <Button onClick={handleUpload} disabled={uploading} className="w-full">
                {uploading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 mr-2" />
                )}
                {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Recording'}
              </Button>
              {uploading && <Progress value={uploadProgress} className="mt-2" />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceTraining;
