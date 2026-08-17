import { View, StyleSheet } from 'react-native';
import { VoiceRecorder } from '../../src/VoiceRecorder';

export default function App() {

  return (
    <View style={styles.container}>

      <VoiceRecorder
        onConfirm={(path) => {
          console.log("Audio URL confirmed:", path);

          }}

      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#d4cacaff',
    padding: 10,
  },

});
