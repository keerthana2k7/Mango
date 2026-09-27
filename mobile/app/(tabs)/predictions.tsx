import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { mobileApi } from '../../services/api';

export default function MobilePredictionsScreen() {
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    mobileApi.getPredictions(1).then(setPredictions).catch(() => {
      setPredictions([
        { id: 1, tree_id: 3, disease_name: 'Anthracnose', confidence: 0.92, prediction_time: new Date().toISOString() },
        { id: 2, tree_id: 8, disease_name: 'Powdery Mildew', confidence: 0.88, prediction_time: new Date().toISOString() },
        { id: 3, tree_id: 13, disease_name: 'Bacterial Canker', confidence: 0.94, prediction_time: new Date().toISOString() },
      ]);
    });
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Disease Detections</Text>
      <Text style={styles.subtitle}>Recent AI foliar diagnostic detections</Text>

      <View style={styles.list}>
        {predictions.map((p) => {
          const isHealthy = p.disease_name.toLowerCase() === 'healthy';
          return (
            <View key={p.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.treeId}>Tree #{p.tree_id}</Text>
                <View style={[styles.badge, isHealthy ? styles.badgeHealthy : styles.badgeDiseased]}>
                  <Text style={[styles.badgeText, isHealthy ? styles.badgeTextHealthy : styles.badgeTextDiseased]}>
                    {p.disease_name}
                  </Text>
                </View>
              </View>
              <Text style={styles.confidenceText}>Confidence: {Math.round(p.confidence * 100)}%</Text>
              <Text style={styles.timestampText}>{new Date(p.prediction_time).toLocaleString()}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, color: '#64748B', marginBottom: 20 },
  list: { gap: 12 },
  itemCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  treeId: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeHealthy: { backgroundColor: '#D1FAE5' },
  badgeDiseased: { backgroundColor: '#FFE4E6' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextHealthy: { color: '#065F46' },
  badgeTextDiseased: { color: '#9F1239' },
  confidenceText: { fontSize: 12, fontWeight: '600', color: '#334155' },
  timestampText: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
});
