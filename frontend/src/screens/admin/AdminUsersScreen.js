import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import UserCard from '../../components/UserCard';
import Toast from '../../components/Toast';
import DataService from '../../api/DataService';

const AdminUsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
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

  const handleToggleBlock = useCallback((userId, currentBlocked) => {
    const targetUser = users.find((u) => String(u._id || u.id) === String(userId));
    const userName = targetUser?.name || 'this user';
    const actionName = currentBlocked ? 'Unblock' : 'Block';

    const performAction = async () => {
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
          message: `${userName} ${currentBlocked ? 'unblocked' : 'blocked'} successfully`,
          type: 'success',
        });
      } catch (e) {
        setToast({
          visible: true,
          message: `Failed to ${actionName.toLowerCase()} user`,
          type: 'error',
        });
      }
    };

    if (Platform.OS === 'web') {
      const msg = `Are you sure you want to ${actionName.toLowerCase()} account access for "${userName}"?`;
      if (typeof window !== 'undefined' && window.confirm(msg)) {
        performAction();
      }
      return;
    }

    Alert.alert(
      `${actionName} Account`,
      `Are you sure you want to ${actionName.toLowerCase()} account access for "${userName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionName,
          style: currentBlocked ? 'default' : 'destructive',
          onPress: performAction,
        },
      ]
    );
  }, [users]);


  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Type / status filter
      if (selectedType === 'blocked') {
        if (!u.isBlocked) return false;
      } else if (selectedType !== 'all') {
        if ((u.buyerType || 'Student').toLowerCase() !== selectedType.toLowerCase()) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (u.name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const dept = (u.department || '').toLowerCase();
        const residence = (u.residence || u.deliveryAddress || '').toLowerCase();
        const cuetId = (u.cuetId || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          dept.includes(q) ||
          residence.includes(q) ||
          cuetId.includes(q) ||
          phone.includes(q)
        );
      }
      return true;
    });
  }, [users, selectedType, searchQuery]);

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
        data={filteredUsers}
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
              Manage {users.length} registered campus student & faculty accounts
            </Text>

            {/* Search Bar */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name, ID, email, hall, or phone..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textGray} />
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {[
                { label: 'All Users', value: 'all' },
                { label: 'Students', value: 'student' },
                { label: 'Teachers', value: 'teacher' },
                { label: 'Staff', value: 'staff' },
                { label: 'Blocked', value: 'blocked' },
              ].map((chip) => {
                const isActive = selectedType === chip.value;
                return (
                  <TouchableOpacity
                    key={chip.value}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => setSelectedType(chip.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyText}>No users matched your search.</Text>
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
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 120,
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
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: spacing.borderRadiusMd,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm + 4,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textDark,
    marginLeft: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs + 4,
    paddingVertical: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: spacing.borderRadiusFull,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textGray,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textGray,
    fontFamily: fonts.regular,
    fontSize: 14,
    marginTop: spacing.sm,
  },
});

export default AdminUsersScreen;
