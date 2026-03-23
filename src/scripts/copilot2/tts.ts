// src/scripts/copilot2/tts.ts - ElevenLabs TTS via /api/tts proxy
// Falls back to Web Speech API if ElevenLabs fails

export class TTSService {
  private speaking = false;
  private cancelled = false;
  private currentAudio: HTMLAudioElement | null = null;
  private fallbackSynth: SpeechSynthesis;
  private fallbackVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    this.fallbackSynth = window.speechSynthesis;
    this.selectFallbackVoice();
    if (this.fallbackSynth.onvoiceschanged !== undefined) {
      this.fallbackSynth.onvoiceschanged = () => this.selectFallbackVoice();
    }
  }

  private selectFallbackVoice(): void {
    const voices = this.fallbackSynth.getVoices();
    const ptVoices = voices.filter(v => v.lang.startsWith('pt'));
    this.fallbackVoice = ptVoices.find(v => v.name.toLowerCase().includes('luciana'))
      || ptVoices[0] || voices[0] || null;
  }

  async speak(text: string): Promise<void> {
    if (!text.trim()) return;
    this.cancelled = false;

    try {
      await this.speakElevenLabs(text);
    } catch {
      // Fallback to browser TTS
      await this.speakBrowser(text);
    }
  }

  private async speakElevenLabs(text: string): Promise<void> {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) throw new Error('TTS API failed');

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    return new Promise<void>((resolve, reject) => {
      const audio = new Audio(url);
      this.currentAudio = audio;
      this.speaking = true;

      audio.onended = () => {
        this.speaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        this.speaking = false;
        this.currentAudio = null;
        URL.revokeObjectURL(url);
        reject(new Error('Audio playback failed'));
      };

      if (this.cancelled) {
        URL.revokeObjectURL(url);
        resolve();
        return;
      }

      audio.play().catch(() => {
        URL.revokeObjectURL(url);
        reject(new Error('Audio play blocked'));
      });
    });
  }

  private async speakBrowser(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      if (this.fallbackVoice) utterance.voice = this.fallbackVoice;
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
      utterance.volume = 0.9;
      utterance.lang = 'pt-BR';

      utterance.onend = () => { this.speaking = false; resolve(); };
      utterance.onerror = () => { this.speaking = false; resolve(); };

      this.speaking = true;
      this.fallbackSynth.speak(utterance);
    });
  }

  /**
   * Speak text sentence by sentence with synced callback
   */
  async speakWithSync(
    text: string,
    onSentence: (sentence: string, index: number) => void,
    pauseBetween = 600
  ): Promise<void> {
    const sentences = this.splitIntoSentences(text);
    this.cancelled = false;

    for (let i = 0; i < sentences.length; i++) {
      if (this.cancelled) break;
      const sentence = sentences[i];
      onSentence(sentence, i);
      await this.speak(sentence);
      if (i < sentences.length - 1 && !this.cancelled) {
        await this.pause(pauseBetween);
      }
    }
  }

  private splitIntoSentences(text: string): string[] {
    const raw = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    return raw.map(s => s.trim()).filter(Boolean);
  }

  async pause(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  stop(): void {
    this.cancelled = true;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    this.fallbackSynth.cancel();
    this.speaking = false;
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }
}
