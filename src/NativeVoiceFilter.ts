import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startRecording(): void;
  stopRecording(): Promise<string>;
  cancelRecording(): void;
  getAmplitude(): number;
  playRecording(path: string): void;
  pauseRecording(): void;
  stopPlayback(): void;
  isPlaying(): boolean;
  getCurrentPosition(): number;
  getDuration(): number;
  applyFilter(inputPath: string, filterType: string): Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('EnVoiceFilterSpec');