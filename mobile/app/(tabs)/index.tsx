import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { mobileApi } from '../../services/api';

export default function MobileDashboard() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await mobileApi.getAnalytics(1);
      setAnalytics(data);
    } catch (e) {
      // Fallback data
      setAnalytics({
        farm_name: 'Salem Mango Orchard',
        total_trees: 24,
        health_score: 75.0,
        health_distribution: { healthy_count: 18, diseased_count: 4, unknown_count: 2 },
        active_cameras: 1,
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#047857" />}
    >
      {/* Header Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning 👋</Text>
        <Text style={styles.farmTitle}>{analytics?.farm_name || 'Salem Mango Orchard'}</Text>
        <Text style={styles.subtitle}>Salem, Tamil Nadu • 5.5 Acres</Text>
      </View>

      {/* Main Health Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>ORCHARD HEALTH INDEX</Text>
        <Text style={styles.heroScore}>{analytics?.health_score || 75}%</Text>
        <Text style={styles.heroSubtext}>Optimal Canopy Condition</Text>
      </View>

      {/* Metric Cards Grid */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Stand</Text>
          <Text style={styles.cardValue}>{analytics?.total_trees || 24}</Text>
          <Text style={styles.cardSub}>4 Orchard Rows</Text>
        </View>

        <View style={[styles.card, { borderColor: '#A7F3D0' }]}>
          <Text style={[styles.cardTitle, { color: '#047857' }]}>Healthy</Text>
          <Text style={[styles.cardValue, { color: '#047857' }]}>
            {analytics?.health_distribution?.healthy_count || 18}
          </Text>
          <Text style={styles.cardSub}>75% of Parcel</Text>
        </View>

        <View style={[styles.card, { borderColor: '#FECDD3' }]}>
          <Text style={[styles.cardTitle, { color: '#E11D48' }]}>Diseased</Text>
          <Text style={[styles.cardValue, { color: '#E11D48' }]}>
            {analytics?.health_distribution?.diseased_count || 4}
          </Text>
          <Text style={styles.cardSub}>Requires Spray</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Rail Camera</Text>
          <Text style={styles.cardValue}>1 Active</Text>
          <Text style={styles.cardSub}>● Online Scouting</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5' },
  content: { padding: 20 },
  header: { marginBottom: 20 },
  greeting: { fontSize: 13, fontWeight: '700', color: '#059669', textTransform: 'uppercase' },
  farmTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', marginTop: 2 },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  heroCard: {
    backgroundColor: '#064E3B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  heroLabel: { fontSize: 11, fontWeight: '800', color: '#6EE7B7', letterSpacing: 1 },
  heroScore: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', marginVertical: 4 },
  heroSubtext: { fontSize: 12, color: '#D1FAE5' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' },
  cardValue: { fontSize: 26, fontWeight: '900', color: '#0F172A', marginVertical: 4 },
  cardSub: { fontSize: 11, color: '#64748B', fontWeight: '500' },
});
