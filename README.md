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

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
