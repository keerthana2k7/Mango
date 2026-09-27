import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function MobileProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>M</Text>
      </View>
      <Text style={styles.name}>Admin Mithilesh</Text>
      <Text style={styles.role}>FARM MANAGER • SALEM ORCHARD</Text>
      <Text style={styles.email}>admin@mangovision.com</Text>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>SYSTEM INFO</Text>
        <Text style={styles.infoItem}>FastAPI Backend: v1.0.0 (Connected)</Text>
        <Text style={styles.infoItem}>ML Classification: 8 Mango Disease Classes</Text>
        <Text style={styles.infoItem}>Scouting Mode: Overhead Rail Simulation</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F5', padding: 24, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 28, backgroundColor: '#064E3B', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  name: { fontSize: 20, fontWeight: '900', color: '#0F172A' },
  role: { fontSize: 10, fontWeight: '800', color: '#059669', letterSpacing: 1, marginTop: 4 },
  email: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 24 },
  infoCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  infoTitle: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12 },
  infoItem: { fontSize: 12, fontWeight: '600', color: '#334155', marginBottom: 8 },
  logoutBtn: { width: '100%', paddingVertical: 14, borderRadius: 18, backgroundColor: '#FEE2E2', alignItems: 'center' },
  logoutText: { color: '#B91C1C', fontSize: 13, fontWeight: '800' },
});
