export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onAudioData: (data: Float32Array) => void;

  constructor(onAudioData: (data: Float32Array) => void) {
    this.onAudioData = onAudioData;
  }

  public async start(): Promise<void> {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      throw new Error('getUserMedia not supported on your browser!');
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = this.audioContext.createMediaStreamSource(stream);
    
    // Note: ScriptProcessorNode is deprecated, but necessary for simple audio level analysis without AudioWorklets.
    this.processor = this.audioContext.createScriptProcessor(1024, 1, 1);
    source.connect(this.processor);
    this.processor.connect(this.audioContext.destination);

    this.processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      this.onAudioData(new Float32Array(inputData));
    };

    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.start();
  }

  public stop(): void {
    this.mediaRecorder?.stop();
    this.processor?.disconnect();
    this.audioContext?.close();
    this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
  }
}