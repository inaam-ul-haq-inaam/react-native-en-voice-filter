# react-native-en-voice-filter

A React Native library for voice recording with built-in voice filters.

## Installation

```sh
npm install react-native-en-voice-filter
# or
yarn add react-native-en-voice-filter
```

Since this library uses `react-native-vector-icons`, make sure it is properly installed and linked in your project.

## Usage

You can use the `VoiceRecorder` component to allow users to record audio and optionally apply voice filters.

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VoiceRecorder } from 'react-native-en-voice-filter';

export default function App() {
  return (
    <View style={styles.container}>
      <VoiceRecorder 
        onRecordComplete={(audioPath) => console.log('Recording completed at:', audioPath)}
        onConfirm={(audioPath) => console.log('Final audio selected at:', audioPath)}
        micIconColor="#8A58FF"
        micIconName="mic"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onRecordComplete` | `(audioPath: string) => void` | `undefined` | Callback fired when recording stops successfully. |
| `onConfirm` | `(audioPath: string) => void` | `undefined` | Callback fired when the user confirms the final filtered audio. |
| `micIconColor` | `string` | `'#8A58FF'` | Color of the microphone icon. |
| `micIconName` | `string` | `'mic'` | Icon name (from `react-native-vector-icons/Ionicons`). |
| `attachedIconName` | `string` | `'musical-notes'` | Icon name for the attached-audio (music) button. |
| `attachedIconColor` | `string` | `'#FFFFFF'` | Color of the attached-audio icon. |
| `attachedButtonColor` | `string` | `'#34C759'` | Background color of the attached-audio button. |
| `deleteIconName` | `string` | `'trash'` | Icon name for the delete action button. |
| `editIconName` | `string` | `'create'` | Icon name for the edit action button. |
| `cancelIconName` | `string` | `'close'` | Icon name for the cancel action button. |
| `actionIconColor` | `string` | `'#FFFFFF'` | Color of the action menu icons (delete/edit/cancel). |
| `actionIconSize` | `number` | `18` | Size of the action menu icons. |
| `playIconName` | `string` | `'play'` | Play icon name in the filter drawer. |
| `pauseIconName` | `string` | `'pause'` | Pause icon name in the filter drawer. |
| `closeIconName` | `string` | `'close'` | Close icon name in the filter drawer header. |
| `confirmIconName` | `string` | `'checkmark'` | Confirm (tick) icon name in the filter drawer. |
| `iconColor` | `string` | `'#FFFFFF'` | Color of the drawer icons (play/pause/confirm). |
| `accentColor` | `string` | `'#8A58FF'` | Accent color for play button and active filter chip. |
| `titleText` | `string` | `'Voice Filters'` | Title text of the filter drawer. |
| `playerTitleText` | `string` | `'Recorded Audio'` | Player title text in the filter drawer. |
| `processingText` | `string` | `'Applying filter...'` | Processing/loading text in the filter drawer. |
| `filterOptions` | `string[]` | `['Original', 'Slow', 'Fast', 'Chipmunk', 'Baby', 'Robot', 'Echo', 'Hacker']` | List of filter options shown as chips. |
| `drawerBackgroundColor` | `string` | `'#1E1E2D'` | Background color of the filter drawer container. |
| `playerCardColor` | `string` | `'#2A2A3A'` | Background color of the audio player card. |
| `filterChipColor` | `string` | `'#2A2A3A'` | Background color of unselected filter chips. |
| `checkButtonColor` | `string` | `'#3A3A4A'` | Background color of the confirm (tick) button. |
| `waveformColor` | `string` | `'#8A58FF'` | Color of the waveform bars in the player. |
| `titleColor` | `string` | `'#FFF'` | Color of the drawer title text. |
| `playerTitleColor` | `string` | `'#FFF'` | Color of the player title text. |
| `sectionTitleColor` | `string` | `'#A0A0B0'` | Color of the "Select Filter" section title. |
| `timerTextColor` | `string` | `'#A0A0B0'` | Color of the timer text in the player. |
| `closeIconColor` | `string` | `'#A0A0B0'` | Color of the close icon in the drawer header. |
| `overlayColor` | `string` | `'rgba(0,0,0,0.5)'` | Background color of the modal overlay behind the drawer. |
| `micButtonColor` | `string` | `'#cfcbc7'` | Background color of the mic button. |
| `micButtonActiveColor` | `string` | `'#dbdbe8'` | Background color of the mic button while recording. |
| `tooltipBackgroundColor` | `string` | `'#1A1A24'` | Background color of the recording/action tooltip. |
| `recordingWaveColor` | `string` | `'#FF3B30'` | Color of the real-time recording waveform bars. |
| `recordingTimerColor` | `string` | `'#FF3B30'` | Color of the recording timer text. |
| `actionButtonColor` | `string` | `'#282834'` | Background color of the action circle buttons (delete/edit/cancel/stop). |
| `cancelIconColor` | `string` | `'#A0A0B0'` | Color of the cancel (✕) icon. |
| `dividerColor` | `string` | `'#3A3A4A'` | Color of the divider lines in the tooltip. |
| `stopButtonColor` | `string` | `'#FF3B30'` | Color of the stop square button. |

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
