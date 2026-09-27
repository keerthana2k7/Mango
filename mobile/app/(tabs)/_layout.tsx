import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTitleStyle: { fontWeight: '800', color: '#0F172A' },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#047857',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="farm"
        options={{
          title: 'Orchard Grid',
          tabBarLabel: 'Farm',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🌳</Text>,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Rail Camera',
          tabBarLabel: 'Camera',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📷</Text>,
        }}
      />
      <Tabs.Screen
        name="predictions"
        options={{
          title: 'Disease Alerts',
          tabBarLabel: 'Alerts',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
