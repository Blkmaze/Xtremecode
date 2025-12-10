/**
 * Xtreme Stream Player - Android IPTV App
 * Compatible with Fire Stick and other Android devices
 *
 * @format
 */

import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Platform,
} from 'react-native';
import MainApp from './src/components/MainApp';

function App(): React.JSX.Element {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a1a1a"
        hidden={false}
      />
      <MainApp />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
});

export default App;
