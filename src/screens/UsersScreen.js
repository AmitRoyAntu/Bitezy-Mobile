import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, FONTS, SIZES, SHADOWS } from '../constants/theme';
import { DEMO_USERS } from '../constants/demoData';
import Header from '../components/Header';
import UserCard from '../components/UserCard';
import Toast from '../components/Toast';

export default function UsersScreen() {
  const [users, setUsers] = useState(DEMO_USERS);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const buyers = users.filter(u => u.role === 'buyer');

  const handleToggleBlock = useCallback((userId, currentStatus) => {
    setUsers(prev =>
      prev.map(u =>
        u._id === userId ? { ...u, isBlocked: !currentStatus } : u
      )
    );
    setToast({
      visible: true,
      message: `User ${!currentStatus ? 'blocked' : 'unblocked'} successfully`,
      type: 'success',
    });
  }, []);

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>
          Manage all registered student and staff accounts.
        </Text>

        <View style={styles.sectionCard}>
          {buyers.length === 0 ? (
            <Text style={styles.emptyText}>No users found.</Text>
          ) : (
            buyers.map(user => (
              <UserCard
                key={user._id}
                user={user}
                onToggleBlock={handleToggleBlock}
              />
            ))
          )}
        </View>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: SIZES.paddingScreen,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.poppinsBold,
    color: COLORS.dark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    padding: 20,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    paddingVertical: 40,
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
});
