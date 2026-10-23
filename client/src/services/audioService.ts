export interface AudioNoiseData {
  decibels: number;
  volumePercent: number;
  status: 'QUIET' | 'MODERATE' | 'LOUD';
  isLoud: boolean;
}

export class ClassroomAudioMeter {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;
  private onNoiseUpdate: ((data: AudioNoiseData) => void) | null = null;
  private isRunning: boolean = false;

  public async start(onUpdate: (data: AudioNoiseData) => void): Promise<boolean> {
    this.onNoiseUpdate = onUpdate;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.8;

      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      this.isRunning = true;
      this.analyze();
      return true;
    } catch (err) {
      console.warn('Microphone access denied or unavailable. Falling back to ambient audio simulation:', err);
      this.startSimulation();
      return false;
    }
  }

  private analyze = () => {
    if (!this.isRunning || !this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    const volumePercent = Math.min(100, Math.round((average / 128) * 100));

    // Approximate calibrated decibel mapping for laptop mic
    const decibels = Math.round(35 + (volumePercent * 0.55));
    let status: 'QUIET' | 'MODERATE' | 'LOUD' = 'QUIET';
    if (decibels > 72) {
      status = 'LOUD';
    } else if (decibels > 52) {
      status = 'MODERATE';
    }

    if (this.onNoiseUpdate) {
      this.onNoiseUpdate({
        decibels,
        volumePercent,
        status,
        isLoud: status === 'LOUD'
      });
    }

    this.animationFrameId = requestAnimationFrame(this.analyze);
  };

  private simInterval: any = null;
  private startSimulation() {
    this.isRunning = true;
    this.simInterval = setInterval(() => {
      if (!this.isRunning) return;
      const baseDb = 42 + Math.random() * 15;
      const decibels = Math.round(baseDb);
      const volumePercent = Math.round((decibels - 35) / 0.55);
      const status: 'QUIET' | 'MODERATE' | 'LOUD' = decibels > 72 ? 'LOUD' : decibels > 52 ? 'MODERATE' : 'QUIET';

      if (this.onNoiseUpdate) {
        this.onNoiseUpdate({
          decibels,
          volumePercent: Math.max(5, Math.min(95, volumePercent)),
          status,
          isLoud: status === 'LOUD'
        });
      }
    }, 600);
  }

  public stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }
}
