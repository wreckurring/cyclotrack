import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import TrackerScreen from './src/screens/TrackerScreen';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TrackerScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});