import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { mobileApi } from '../../services/api';

export default function MobileCameraScreen() {
  const [status, setStatus] = useState<any>({
    status: 'ONLINE',
    current_row: 1,
    current_column: 1,
    current_tree_number: 'T-R01-C01',
    speed_m_per_s: 1.0,
    rail_position_meters: 5.0,
    progress_percentage: 4.2,
    last_event: 'Camera Rig Synchronized',
  });
  const [isRunning, setIsRunning] = useState(false);

  const toggleSimulation = async () => {
    try {
      if (isRunning) {
        await mobileApi.pauseSimulation(1);
        setIsRunning(false);
      } else {
        await mobileApi.startSimulation(1, 1.2);
        setIsRunning(true);
      }
    } catch (e) {
      setIsRunning(!isRunning);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Rail Camera Controller</Text>
      <Text style={styles.subtitle}>Overhead carriage telemetry and movement control</Text>

      {/* Main Status Panel */}
      <View style={styles.camCard}>
        <View style={styles.camHeader}>
          <Text style={styles.camName}>Rail-Cam-01 (North Quadrant)</Text>
          <View style={styles.livePill}>
            <Text style={styles.liveText}>● {isRunning ? 'MOVING' : 'ONLINE'}</Text>
          </View>
        </View>

        <View style={styles.readoutBox}>
          <Text style={styles.readoutLabel}>CURRENT INSPECTION TARGET</Text>
          <Text style={styles.readoutValue}>{status.current_tree_number || 'Tree #01'}</Text>
          <Text style={styles.readoutSub}>Row {status.current_row} • Column {status.current_column}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Rail Traversal</Text>
            <Text style={styles.statVal}>{status.rail_position_meters} m</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Scout Speed</Text>
            <Text style={styles.statVal}>{status.speed_m_per_s} m/s</Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Progress</Text>
            <Text style={styles.statVal}>{status.progress_percentage}%</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        onPress={toggleSimulation}
        style={[styles.primaryBtn, isRunning ? styles.btnPause : styles.btnStart]}
      >
        <Text style={styles.primaryBtnText}>{isRunning ? 'Pause Rail Camera' : 'Start Automated Scouting'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginBottom: 20 },
  camCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  camHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  camName: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  livePill: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  liveText: { fontSize: 10, fontWeight: '800', color: '#047857' },
  readoutBox: { backgroundColor: '#F8FAFC', borderRadius: 18, padding: 16, alignItems: 'center', marginVertical: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  readoutLabel: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  readoutValue: { fontSize: 28, fontWeight: '900', color: '#0F172A', marginVertical: 4 },
  readoutSub: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  statCol: { alignItems: 'center' },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  statVal: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  primaryBtn: { paddingVertical: 16, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  btnStart: { backgroundColor: '#064E3B' },
  btnPause: { backgroundColor: '#D97706' },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
