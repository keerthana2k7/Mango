import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { mobileApi } from '../../services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MobileFarmView() {
  const [layout, setLayout] = useState<any | null>(null);
  const [trees, setTrees] = useState<any[]>([]);
  const [simStatus, setSimStatus] = useState<any | null>(null);
  const [selectedTree, setSelectedTree] = useState<any | null>(null);

  // Load Farm Data & Layout
  useEffect(() => {
    mobileApi.getFarmTrees(1).then(setTrees).catch(() => {});
    
    // Synthetic fallback layout
    const demoTrees = [];
    for (let r = 1; r <= 4; r++) {
      for (let c = 1; c <= 6; c++) {
        demoTrees.push({
          id: (r - 1) * 6 + c,
          tree_number: `T-R0${r}-C0${c}`,
          row_number: r,
          column_number: c,
          health_status: (r + c) % 5 === 0 ? 'DISEASE_DETECTED' : 'HEALTHY',
          variety: 'Alphonso',
        });
      }
    }
    setTrees(demoTrees);
  }, []);

  // Poll simulation status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await mobileApi.getSimulationStatus(1);
        setSimStatus(res);
      } catch (err) {
        // silent catch
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleStartSim = async () => {
    try {
      const res = await mobileApi.startSimulation(1, 1.0);
      setSimStatus(res);
    } catch (e) {}
  };

  const handlePauseSim = async () => {
    try {
      const res = await mobileApi.pauseSimulation(1);
      setSimStatus(res);
    } catch (e) {}
  };

  const isRunning = simStatus?.status === 'MOVING' || simStatus?.status === 'CAPTURING';
  const currentTreeId = simStatus?.current_tree_id;
  const currentTreeNum = simStatus?.current_tree_number || 'T-R01-C01';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Live Farm Map</Text>
          <Text style={styles.subtitle}>Salem Heritage Mango Orchard</Text>
        </View>

        <View style={[styles.liveTag, isRunning ? styles.liveTagActive : styles.liveTagIdle]}>
          <View style={[styles.liveDot, isRunning ? styles.liveDotActive : styles.liveDotIdle]} />
          <Text style={styles.liveText}>{isRunning ? 'CAMERA LIVE' : 'ONLINE'}</Text>
        </View>
      </View>

      {/* Map Boundary Container */}
      <View style={styles.mapContainer}>
        {/* Plot Header */}
        <View style={styles.plotHeader}>
          <Text style={styles.plotLabel}>ORCHARD PLOT 01 • HIGH DENSITY</Text>
          <Text style={styles.coordText}>
            X: {simStatus?.x ? `${simStatus.x}m` : '15.0m'} • Y: {simStatus?.y ? `${simStatus.y}m` : '16.0m'}
          </Text>
        </View>

        {/* 4 Rows Representation with Rail Track */}
        {[1, 2, 3, 4].map((rowNum) => {
          const rowTrees = trees.filter((t) => t.row_number === rowNum);
          const isCamRow = simStatus?.current_row === rowNum;

          return (
            <View key={rowNum} style={styles.rowWrapper}>
              {/* Row Canopy Track */}
              <View style={styles.rowBed}>
                <Text style={styles.rowTag}>R0{rowNum}</Text>
                <View style={styles.treesFlex}>
                  {rowTrees.map((tree) => {
                    const isHealthy = tree.health_status === 'HEALTHY';
                    const isDiseased = tree.health_status === 'DISEASE_DETECTED';
                    const isTreated = tree.health_status === 'TREATED';
                    const isInspecting = currentTreeId === tree.id;

                    return (
                      <TouchableOpacity
                        key={tree.id}
                        onPress={() => setSelectedTree(tree)}
                        style={[
                          styles.treePin,
                          isInspecting
                            ? styles.pinInspecting
                            : isHealthy
                            ? styles.pinHealthy
                            : isTreated
                            ? styles.pinTreated
                            : isDiseased
                            ? styles.pinDiseased
                            : styles.pinUnknown,
                        ]}
                      >
                        <Text style={styles.treePinIcon}>{isTreated ? '💊' : '🌳'}</Text>
                        <Text style={styles.treePinText}>C0{tree.column_number}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Overhead Rail Line */}
              <View style={styles.railTrack}>
                <View style={styles.railSteel} />
                {isCamRow && (
                  <View
                    style={[
                      styles.camCarriage,
                      {
                        left: `${((simStatus?.current_column || 1) - 0.5) * (100 / 6)}%`,
                      },
                    ]}
                  >
                    <Text style={styles.camIcon}>📷</Text>
                    <Text style={styles.camLabel}>{simStatus?.is_capturing ? 'FLASH' : 'LIVE'}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {/* Map Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Healthy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F43F5E' }]} />
            <Text style={styles.legendText}>Diseased</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#0D9488' }]} />
            <Text style={styles.legendText}>Treated</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Inspecting</Text>
          </View>
        </View>
      </View>

      {/* Live Inspection & Telemetry Card */}
      <View style={styles.telemetryCard}>
        <View style={styles.telemHeader}>
          <Text style={styles.telemTitle}>Active Telemetry</Text>
          <Text style={styles.telemSpeed}>{simStatus?.speed_m_per_s || 1.0} m/s</Text>
        </View>

        <View style={styles.telemBody}>
          <Text style={styles.telemTree}>
            Inspecting: <Text style={styles.bold}>{currentTreeNum}</Text>
          </Text>
          <Text style={styles.telemDiag}>
            {simStatus?.last_prediction
              ? `${simStatus.last_prediction.disease_name} (${Math.round(simStatus.last_prediction.confidence * 100)}%)`
              : 'Canopy foliar scan in progress'}
          </Text>
        </View>

        {/* Action Controls */}
        <View style={styles.btnRow}>
          {!isRunning ? (
            <TouchableOpacity onPress={handleStartSim} style={styles.startBtn}>
              <Text style={styles.btnText}>Start Scouting</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handlePauseSim} style={styles.pauseBtn}>
              <Text style={styles.btnText}>Pause</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tree Detail Modal */}
      {selectedTree && (
        <Modal transparent animationType="fade" visible={!!selectedTree}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalEmoji}>🌳</Text>
              <Text style={styles.modalTreeNumber}>Tree {selectedTree.tree_number}</Text>
              <Text style={styles.modalRowCol}>
                Row {selectedTree.row_number} • Column {selectedTree.column_number} • {selectedTree.variety}
              </Text>

              <View
                style={[
                  styles.statusPill,
                  selectedTree.health_status === 'HEALTHY'
                    ? styles.pillHealthy
                    : selectedTree.health_status === 'TREATED'
                    ? styles.pillTreated
                    : styles.pillDiseased,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    selectedTree.health_status === 'HEALTHY'
                      ? styles.pillTextHealthy
                      : selectedTree.health_status === 'TREATED'
                      ? styles.pillTextTreated
                      : styles.pillTextDiseased,
                  ]}
                >
                  {selectedTree.health_status === 'HEALTHY'
                    ? 'Healthy Canopy'
                    : selectedTree.health_status === 'TREATED'
                    ? 'Treated / In Recovery'
                    : 'Disease Detected: Anthracnose'}
                </Text>
              </View>

              {selectedTree.health_status === 'DISEASE_DETECTED' && (
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await mobileApi.logTreatment({
                        tree_id: selectedTree.id,
                        chemical_name: 'Copper Oxychloride 50 WP (0.3%)',
                        treatment_type: 'CHEMICAL',
                        operator_name: 'Field Operator',
                        update_tree_health: true,
                        new_health_status: 'TREATED',
                      });
                      setSelectedTree({ ...selectedTree, health_status: 'TREATED' });
                      mobileApi.getFarmTrees(1).then(setTrees).catch(() => {});
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  style={styles.treatBtn}
                >
                  <Text style={styles.treatBtnText}>💊 Mark as Treated (Copper Spray)</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setSelectedTree(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5' },
  content: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  liveTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  liveTagActive: { backgroundColor: '#D1FAE5' },
  liveTagIdle: { backgroundColor: '#F1F5F9' },
  liveDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  liveDotActive: { backgroundColor: '#059669' },
  liveDotIdle: { backgroundColor: '#94A3B8' },
  liveText: { fontSize: 9, fontWeight: '800', color: '#065F46' },
  mapContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  plotHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  plotLabel: { fontSize: 10, fontWeight: '900', color: '#065F46', letterSpacing: 0.5 },
  coordText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  rowWrapper: { marginBottom: 14 },
  rowBed: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  rowTag: { fontSize: 9, fontWeight: '900', color: '#047857', marginRight: 6, width: 22 },
  treesFlex: { flex: 1, flexDirection: 'row', justifyContent: 'space-between' },
  treePin: {
    width: 38,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  pinHealthy: { backgroundColor: '#FFFFFF', borderColor: '#34D399' },
  pinDiseased: { backgroundColor: '#FFF1F2', borderColor: '#FDA4AF' },
  pinUnknown: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  pinInspecting: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', transform: [{ scale: 1.08 }] },
  treePinIcon: { fontSize: 14 },
  treePinText: { fontSize: 8, fontWeight: '800', color: '#475569', marginTop: 1 },
  railTrack: { height: 16, justifyContent: 'center', marginHorizontal: 28, position: 'relative' },
  railSteel: { height: 2, backgroundColor: '#CBD5E1', borderRadius: 1 },
  camCarriage: {
    position: 'absolute',
    top: -6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: -16,
  },
  camIcon: { fontSize: 9, marginRight: 2 },
  camLabel: { fontSize: 8, fontWeight: '900', color: '#FFFFFF' },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 4, paddingTop: 10, borderTopWidth: 1, borderColor: '#F1F5F9' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  telemetryCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderWidth: 1, borderColor: '#E2E8F0' },
  telemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  telemTitle: { fontSize: 14, fontWeight: '900', color: '#0F172A' },
  telemSpeed: { fontSize: 11, fontWeight: '800', color: '#059669', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  telemBody: { marginBottom: 14 },
  telemTree: { fontSize: 13, color: '#334155', fontWeight: '600' },
  bold: { fontWeight: '900', color: '#0F172A' },
  telemDiag: { fontSize: 12, color: '#64748B', marginTop: 3, fontWeight: '500' },
  btnRow: { flexDirection: 'row' },
  startBtn: { flex: 1, backgroundColor: '#059669', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  pauseBtn: { flex: 1, backgroundColor: '#D97706', paddingVertical: 12, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 28, padding: 24, alignItems: 'center' },
  modalEmoji: { fontSize: 40, marginBottom: 8 },
  modalTreeNumber: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  modalRowCol: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 16 },
  statusPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, marginBottom: 20 },
  pillHealthy: { backgroundColor: '#D1FAE5' },
  pillDiseased: { backgroundColor: '#FFE4E6' },
  statusPillText: { fontSize: 12, fontWeight: '800' },
  pillTextHealthy: { color: '#065F46' },
  pillTextDiseased: { color: '#9F1239' },
  pinTreated: { backgroundColor: '#CCFBF1', borderColor: '#0D9488' },
  pillTreated: { backgroundColor: '#CCFBF1' },
  pillTextTreated: { color: '#0F766E' },
  treatBtn: { width: '100%', backgroundColor: '#0D9488', paddingVertical: 12, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
  treatBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  closeBtn: { width: '100%', backgroundColor: '#0F172A', paddingVertical: 14, borderRadius: 18, alignItems: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
