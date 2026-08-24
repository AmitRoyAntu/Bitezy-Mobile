import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import UserCard from '../../components/UserCard';
import Toast from '../../components/Toast';
import DataService from '../../api/DataService';

const AdminUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await DataService.getUsers();
      // Only show buyer accounts (not sellers or admins)
      const buyers = allUsers.filter((u) => u.role === 'buyer');
      setUsers(buyers);
    } catch (e) {
      console.warn('AdminUsersScreen load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleToggleBlock = useCallback(async (userId, currentBlocked) => {
    try {
      await DataService.blockUser(userId, !currentBlocked);
      setUsers((prev) =>
        prev.map((u) =>
          String(u._id || u.id) === String(userId)
            ? { ...u, isBlocked: !currentBlocked }
            : u
        )
      );
      setToast({
        visible: true,
        message: `User ${!currentBlocked ? 'blocked' : 'unblocked'} successfully`,
        type: 'success',
      });
    } catch (e) {
      setToast({ visible: true, message: 'Failed to update user status', type: 'error' });
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AdminHeader />
      <FlatList
        data={users}
        keyExtractor={(item) => String(item._id || item.id)}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onToggleBlock={handleToggleBlock}
          />
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>User Management</Text>
            <Text style={styles.subtitle}>
              {users.length} registered student & staff accounts
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.headingBold,
    color: colors.textDark,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.textGray,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
});

export default AdminUsersScreen;
