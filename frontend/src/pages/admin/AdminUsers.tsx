/**
 * ADMIN users management page with full CRUD - mobile-friendly, compact, and professional.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Eye,
  AlertCircle,
  CheckCircle2,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  ChevronDown,
  ChevronUp,
  KeyRound,
  ExternalLink,
  ArrowUpDown,
  MoreVertical,
  Copy,
} from "lucide-react";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { AnimatedCard } from "../../components/AnimatedCard";
import { toAbsoluteUrl } from "../../lib/urls";
import { normalizeWhatsAppPhone } from "../../lib/phone";
import { formatDateOnlyWITA } from "../../utils/date";
import { SuccessAlert } from "../../components/SuccessAlert";
import { ConfirmDialog } from "../../components/ConfirmDialog";

type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | string;

interface UserData {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  role: string;
  profile_photo: string | null;
  created_at: string;
  default_latitude?: number | null;
  default_longitude?: number | null;
  status?: UserStatus;
  total_orders?: number;
  orders_count?: number;
  auth_type?: "REGISTERED" | "GUEST_ONLY" | "UNKNOWN" | string;
  primary_address?: string | null;
  primary_address_notes?: string | null;
  primary_address_source?: "SAVED" | "ORDER" | string | null;
  primary_address_latitude?: number | null;
  primary_address_longitude?: number | null;
}

type SortField = "name" | "email" | "role" | "created_at";

function getUserStatusDisplay(user: UserData) {
  const raw = (user.status || "ACTIVE").toString().toUpperCase();
  if (raw === "INACTIVE") {
    return {
      label: "Inactive",
      className: "border-slate-300 text-slate-600 bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
    };
  }
  if (raw === "SUSPENDED") {
    return {
      label: "Suspended",
      className: "border-red-300 text-red-700 bg-transparent dark:border-red-500 dark:text-red-400",
    };
  }
  return {
    label: "Active",
    className: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-300",
  };
}

function formatUserDisplayId(id: number) {
  const padded = id.toString().padStart(5, "0");
  return `LC-${padded}`;
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [monthFilter, setMonthFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [timeFrom, setTimeFrom] = useState<string>("");
  const [timeTo, setTimeTo] = useState<string>("");
  const [showDateFilters, setShowDateFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const itemsPerPage = 10;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [busy, setBusy] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<number | null>(null);
  const [resetPasswordResult, setResetPasswordResult] = useState<{ newPassword: string; userName: string } | null>(null);
  const [customPassword, setCustomPassword] = useState("");
  const [useCustomPassword, setUseCustomPassword] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [bulkRole, setBulkRole] = useState<"USER" | "ADMIN">("USER");
  const [openActionUserId, setOpenActionUserId] = useState<number | null>(null);
  const [authFilter, setAuthFilter] = useState<string>("ALL");

  const totalUsers = users.length;
  const totalAdmins = users.filter(user => user.role === "ADMIN").length;
  const totalRegularUsers = users.filter(user => user.role === "USER").length;
  const usersActiveThisMonth = users.filter(user => {
    const created = new Date(user.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  const hasSelection = selectedUserIds.length > 0;

  // Address state for detail modal (fallback only if no primary_address provided)
  const [addressName, setAddressName] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const primaryLatForSelected =
    selectedUser?.primary_address_latitude ?? selectedUser?.default_latitude ?? null;
  const primaryLngForSelected =
    selectedUser?.primary_address_longitude ?? selectedUser?.default_longitude ?? null;
  const selectedUserMapsUrl =
    primaryLatForSelected != null && primaryLngForSelected != null
      ? `https://www.google.com/maps/search/?api=1&query=${primaryLatForSelected},${primaryLngForSelected}`
      : null;

  useEffect(() => {
    if (!selectedUser) {
      setAddressName(null);
      setIsLoadingAddress(false);
      return;
    }

    if (selectedUser.primary_address) {
      setAddressName(selectedUser.primary_address);
      setIsLoadingAddress(false);
      return;
    }

    if (selectedUser.default_latitude && selectedUser.default_longitude) {
      setIsLoadingAddress(true);
      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedUser.default_latitude}&lon=${selectedUser.default_longitude}&zoom=18&addressdetails=1&accept-language=id&email=admin@lokaclean.com`
      )
        .then((res) => {
          if (!res.ok) throw new Error("Network response was not ok");
          return res.json();
        })
        .then((data) => {
          setAddressName(data.display_name || null);
        })
        .catch((err) => {
          console.error("Address fetch error:", err);
          setAddressName(null);
        })
        .finally(() => setIsLoadingAddress(false));
    } else {
      setAddressName(null);
      setIsLoadingAddress(false);
    }
  }, [
    selectedUser?.id,
    selectedUser?.primary_address,
    selectedUser?.default_latitude,
    selectedUser?.default_longitude
  ]);

  // Form states
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "USER" as "USER" | "ADMIN",
  });

  useEffect(() => {
    refreshUsers();
  }, []);

  async function refreshUsers() {
    setLoading(true);
    try {
      const resp = await api.get("/admin/users");
      const usersData = resp.data.data.users || [];
      setUsers(usersData);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      searchQuery === "" ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone_number.includes(searchQuery);
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const userStatus = (user.status || "ACTIVE").toString().toUpperCase();
    const matchesStatus = statusFilter === "ALL" || userStatus === statusFilter;

    const authType = (user.auth_type || "UNKNOWN").toString().toUpperCase();
    const matchesAuth = authFilter === "ALL" || authType === authFilter;
    
    // Date filters
    const userDate = new Date(user.created_at);
    let matchesDate = true;
    
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (userDate < fromDate) matchesDate = false;
    }
    
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (userDate > toDate) matchesDate = false;
    }
    
    // Month filter
    if (monthFilter !== "ALL") {
      const month = parseInt(monthFilter);
      if (userDate.getMonth() !== month) matchesDate = false;
    }
    
    // Year filter
    if (yearFilter !== "ALL") {
      const year = parseInt(yearFilter);
      if (userDate.getFullYear() !== year) matchesDate = false;
    }
    
    // Time filters
    if (timeFrom) {
      const [hours, minutes] = timeFrom.split(":").map(Number);
      const fromTime = hours * 60 + minutes;
      const userTime = userDate.getHours() * 60 + userDate.getMinutes();
      if (userTime < fromTime) matchesDate = false;
    }
    
    if (timeTo) {
      const [hours, minutes] = timeTo.split(":").map(Number);
      const toTime = hours * 60 + minutes;
      const userTime = userDate.getHours() * 60 + userDate.getMinutes();
      if (userTime > toTime) matchesDate = false;
    }
    
    return matchesSearch && matchesRole && matchesStatus && matchesDate && matchesAuth;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    if (sortBy === "name") {
      return a.full_name.localeCompare(b.full_name) * direction;
    }

    if (sortBy === "email") {
      return a.email.localeCompare(b.email) * direction;
    }

    if (sortBy === "role") {
      return (a.role || "").localeCompare(b.role || "") * direction;
    }

    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return (aDate - bDate) * direction;
  });

  // Get unique years from users
  const availableYears = Array.from(
    new Set(users.map(user => new Date(user.created_at).getFullYear()))
  ).sort((a, b) => b - a);
  
  const months = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ];

  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter, authFilter, dateFrom, dateTo, monthFilter, yearFilter, timeFrom, timeTo]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDirection("asc");
    }
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAllCurrentPage = () => {
    const pageIds = paginatedUsers.map(user => user.id);
    const allSelected = pageIds.every(id => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleAddUser = async () => {
    if (!formData.full_name || !formData.email || !formData.phone_number || !formData.password) {
      setError("All fields are required");
      return;
    }

    const normalizedPhone = normalizeWhatsAppPhone(formData.phone_number);
    if (!normalizedPhone) {
      setError("Nomor WhatsApp tidak valid. Contoh: +628123456789 atau 08123456789.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.post("/admin/users", {
        full_name: formData.full_name,
        email: formData.email.trim().toLowerCase(),
        phone_number: normalizedPhone,
        password: formData.password,
        role: formData.role,
      });
      
      // Reset form and close modal
      setFormData({ full_name: "", email: "", phone_number: "", password: "", role: "USER" });
      setShowAddModal(false);
      await refreshUsers();
      setSuccessMessage(`Pengguna "${formData.full_name}" berhasil dibuat`);
    } catch (err) {
      const rawMessage = getApiErrorMessage(err);
      if (rawMessage.toLowerCase().includes("email already in use") || rawMessage.toLowerCase().includes("email already registered")) {
        setError("Email ini sudah digunakan. Gunakan email lain yang belum terdaftar.");
      } else {
        setError(rawMessage);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser || !formData.full_name || !formData.email || !formData.phone_number) {
      setError("All fields are required");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      type UpdateUserPayload = {
        full_name: string;
        email: string;
        phone_number: string;
        role: "USER" | "ADMIN";
        password?: string;
      };

      const updateData: UpdateUserPayload = {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        role: formData.role,
      };
      
      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password;
      }
      
      await api.put(`/admin/users/${editingUser.id}`, updateData);
      
      // Reset form and close modal
      setFormData({ full_name: "", email: "", phone_number: "", password: "", role: "USER" });
      setEditingUser(null);
      setShowAddModal(false);
      await refreshUsers();
      setSuccessMessage(`Pengguna "${formData.full_name}" berhasil diperbarui`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    setUserToDelete(userId);
    setShowDeleteDialog(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    setBusy(true);
    setError(null);
    try {
      const user = users.find(u => u.id === userToDelete);
      await api.delete(`/admin/users/${userToDelete}`);
      await refreshUsers();
      setSuccessMessage(
        `Pengguna "${user?.full_name || `#${userToDelete}`}" berhasil dihapus`
      );
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setShowDeleteDialog(false);
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = (userId: number) => {
    const user = users.find(u => u.id === userId);
    setUserToResetPassword(userId);
    setCustomPassword("");
    setUseCustomPassword(false);
    setShowResetPasswordDialog(true);
  };

  const confirmResetPassword = async () => {
    if (!userToResetPassword) return;

    // Validate custom password if provided
    if (useCustomPassword && customPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const user = users.find(u => u.id === userToResetPassword);
      
      // Send custom password if provided, otherwise send empty to generate random
      const requestData = useCustomPassword && customPassword ? { password: customPassword } : {};
      const resp = await api.post(`/admin/users/${userToResetPassword}/reset-password`, requestData);
      const newPassword = resp.data.data.newPassword;
      
      setResetPasswordResult({
        newPassword: newPassword,
        userName: user?.full_name || `Pengguna #${userToResetPassword}`
      });
      setShowResetPasswordDialog(false);
      setUserToResetPassword(null);
      setCustomPassword("");
      setUseCustomPassword(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
      setShowResetPasswordDialog(false);
    } finally {
      setBusy(false);
    }
  };

  const handleBulkChangeRole = async () => {
    if (!selectedUserIds.length) return;

    setBusy(true);
    setError(null);
    try {
      await Promise.all(
        selectedUserIds.map(id =>
          api.put(`/admin/users/${id}`, {
            role: bulkRole,
          }),
        ),
      );
      await refreshUsers();
      setSuccessMessage(
        `Berhasil mengubah role ${selectedUserIds.length} pengguna menjadi ${bulkRole}`,
      );
      setSelectedUserIds([]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedUserIds.length) return;
    const confirm = window.confirm(
      `Yakin ingin menghapus ${selectedUserIds.length} pengguna terpilih? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!confirm) return;

    setBusy(true);
    setError(null);
    try {
      for (const id of selectedUserIds) {
        await api.delete(`/admin/users/${id}`);
      }
      await refreshUsers();
      setSuccessMessage(
        `Berhasil menghapus ${selectedUserIds.length} pengguna`,
      );
      setSelectedUserIds([]);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const handleExport = () => {
    if (!sortedUsers.length || typeof window === "undefined") return;

    const nowWita = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Makassar",
      dateStyle: "full",
      timeStyle: "short",
    });

    const usersWithOrders = sortedUsers.map((user) => {
      const candidate = user as typeof user & {
        total_orders?: number;
        orders_count?: number;
        ordersCount?: number;
      };
      const raw =
        candidate.total_orders ??
        candidate.orders_count ??
        candidate.ordersCount ??
        0;
      const ordersCount =
        typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
      return { user, ordersCount };
    });

    const topUsers = [...usersWithOrders]
      .filter((item) => item.ordersCount > 0)
      .sort((a, b) => b.ordersCount - a.ordersCount)
      .slice(0, 5);

    const escapeHtml = (text: string) =>
      text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const topUsersHtml =
      topUsers.length > 0
        ? topUsers
            .map(
              (item, index) => `
          <tr>
            <td>${index + 1}</td>
            <td class="text-left">
              <div class="user-name">${escapeHtml(item.user.full_name)}</div>
              <div class="user-email">${escapeHtml(item.user.email)}</div>
            </td>
            <td>${item.ordersCount.toLocaleString("id-ID")}</td>
          </tr>
        `,
            )
            .join("")
        : `<tr><td colspan="3" class="text-left">Belum ada data frekuensi pesanan per pengguna.</td></tr>`;

    const rowsHtml =
      usersWithOrders.length > 0
        ? usersWithOrders
            .map(({ user, ordersCount }, index) => {
              const rowClass = index % 2 === 0 ? "row-even" : "row-odd";
              return `
          <tr class="${rowClass}">
            <td class="text-left">
              <div class="user-name">${escapeHtml(user.full_name)}</div>
              <div class="user-email">${escapeHtml(user.email)}</div>
            </td>
            <td class="text-left">
              <div>${escapeHtml(user.phone_number || "-")}</div>
            </td>
            <td>${escapeHtml(user.role)}</td>
            <td>${formatDateOnlyWITA(user.created_at)}</td>
            <td>${ordersCount.toLocaleString("id-ID")}</td>
          </tr>
        `;
            })
            .join("")
        : `<tr><td colspan="5" class="text-left">Belum ada pengguna untuk ditampilkan.</td></tr>`;

    const html = `
      <!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Laporan Pengguna - LokaClean</title>
          <style>
            :root {
              color-scheme: light;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              margin: 24px;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 12px;
              color: #020617;
              background-color: #f9fafb;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .brand-logo-wrap {
              width: 30px;
              height: 30px;
              border-radius: 10px;
              overflow: hidden;
              background: #e5e7eb;
              box-shadow: 0 6px 12px rgba(15,23,42,0.25);
            }
            .brand-logo {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .brand-title {
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #0f172a;
            }
            .brand-subtitle {
              margin-top: 2px;
              font-size: 10px;
              color: #64748b;
            }
            .badge {
              padding: 6px 10px;
              border-radius: 999px;
              background: linear-gradient(135deg, #22c55e, #16a34a);
              color: #ecfdf5;
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 0.14em;
              text-transform: uppercase;
            }
            .meta {
              margin-bottom: 10px;
              font-size: 11px;
              color: #64748b;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 10px;
              margin-bottom: 16px;
            }
            .summary-card {
              border-radius: 12px;
              padding: 10px 12px;
              background: linear-gradient(135deg, #ecfdf5, #dcfce7);
              border: 1px solid #bbf7d0;
              color: #022c22;
            }
            .summary-label {
              font-size: 9px;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #047857;
            }
            .summary-value {
              margin-top: 4px;
              font-size: 14px;
              font-weight: 700;
            }
            .summary-sub {
              margin-top: 2px;
              font-size: 10px;
              color: #047857;
              opacity: 0.85;
            }
            .top-users {
              margin-top: 4px;
              margin-bottom: 16px;
              padding: 10px 12px;
              border-radius: 12px;
              background: #0f172a;
              color: #e5e7eb;
              display: grid;
              grid-template-columns: minmax(0, 1.4fr) minmax(0, 2fr);
              gap: 12px;
            }
            .top-users-title {
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 4px;
            }
            .top-users-desc {
              font-size: 10px;
              color: #9ca3af;
            }
            .top-users table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .top-users th,
            .top-users td {
              padding: 4px 6px;
              text-align: left;
              border-bottom: 1px solid rgba(148,163,184,0.5);
            }
            .top-users th {
              font-weight: 600;
              color: #e5e7eb;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .user-name {
              font-weight: 600;
            }
            .user-email {
              margin-top: 2px;
              font-size: 10px;
              color: #6b7280;
            }
            table.main {
              width: 100%;
              border-collapse: collapse;
              margin-top: 4px;
            }
            table.main thead {
              background: #0f172a;
              color: #e5e7eb;
            }
            table.main th,
            table.main td {
              padding: 8px 10px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 11px;
            }
            table.main th {
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.08em;
            }
            table.main td {
              color: #111827;
            }
            table.main td.text-left {
              text-align: left;
            }
            table.main td:nth-child(3),
            table.main td:nth-child(5) {
              white-space: nowrap;
            }
            .row-even {
              background-color: #f9fafb;
            }
            .footer {
              margin-top: 18px;
              font-size: 10px;
              color: #9ca3af;
              display: flex;
              justify-content: space-between;
            }
            @page {
              margin: 18mm 14mm 18mm;
            }
          </style>
        </head>
        <body>
          <header class="header">
            <div class="brand">
              <div class="brand-logo-wrap">
                <img src="/img/logo.jpg" alt="LokaClean Logo" class="brand-logo" />
              </div>
              <div>
                <div class="brand-title">LOKACLEAN</div>
                <div class="brand-subtitle">Laporan Manajemen Pengguna</div>
              </div>
            </div>
            <div class="badge">
              ADMIN · USERS
            </div>
          </header>
          <div class="meta">
            Dibuat pada ${nowWita} (WITA)
          </div>
          <section class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total pengguna</div>
              <div class="summary-value">${totalUsers.toLocaleString(
                "id-ID",
              )}</div>
              <div class="summary-sub">Semua akun terdaftar</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Admin</div>
              <div class="summary-value">${totalAdmins.toLocaleString(
                "id-ID",
              )}</div>
              <div class="summary-sub">Akun dengan akses penuh</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">User</div>
              <div class="summary-value">${totalRegularUsers.toLocaleString(
                "id-ID",
              )}</div>
              <div class="summary-sub">Pelanggan aplikasi</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Aktif bulan ini</div>
              <div class="summary-value">${usersActiveThisMonth.toLocaleString(
                "id-ID",
              )}</div>
              <div class="summary-sub">Pengguna baru periode berjalan</div>
            </div>
          </section>
          <section class="top-users">
            <div>
              <div class="top-users-title">Pengguna paling sering memesan</div>
              <div class="top-users-desc">
                Daftar singkat pelanggan dengan jumlah pesanan tertinggi berdasarkan data sistem.
              </div>
            </div>
            <div>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Pengguna</th>
                    <th>Total pesanan</th>
                  </tr>
                </thead>
                <tbody>
                  ${topUsersHtml}
                </tbody>
              </table>
            </div>
          </section>
          <table class="main">
            <thead>
              <tr>
                <th>Nama & email</th>
                <th>No HP</th>
                <th>Role</th>
                <th>Tanggal daftar</th>
                <th>Total pesanan</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <div class="footer">
            <span>LokaClean Admin · Panel Pengguna</span>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number,
      password: "",
      role: user.role as "USER" | "ADMIN",
    });
    setShowAddModal(true);
  };

  const openDetailModal = (user: UserData) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowDetailModal(false);
    setEditingUser(null);
    setSelectedUser(null);
    setFormData({ full_name: "", email: "", phone_number: "", password: "", role: "USER" });
    setError(null);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
              Manajemen Pengguna
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Kelola akun, peran, dan akses sistem
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen(prev => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
            <span className="sm:hidden">Filter</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingUser(null);
              setFormData({
                full_name: "",
                email: "",
                phone_number: "",
                password: "",
                role: "USER",
              });
              setShowAddModal(true);
            }}
            className="btn-admin-primary"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total Pengguna
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
            {totalUsers.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Admin
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
            {totalAdmins.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            User
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
            {totalRegularUsers.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Pengguna Aktif Bulan Ini
          </div>
          <div className="mt-2 text-xl font-semibold text-slate-900 sm:text-2xl dark:text-slate-50">
            {usersActiveThisMonth.toLocaleString()}
          </div>
        </div>
      </div>

      {hasSelection && (
        <div className="sticky top-0 z-10 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:text-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
          <div className="font-medium">
            {selectedUserIds.length.toLocaleString()} pengguna dipilih
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-300">
              <span>Ubah role ke</span>
              <select
                value={bulkRole}
                onChange={e =>
                  setBulkRole(e.target.value as "USER" | "ADMIN")
                }
                aria-label="Ubah role pengguna terpilih"
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleBulkChangeRole}
              disabled={busy}
              className="btn-admin-primary disabled:opacity-60 rounded-md px-2.5 py-1.5 text-[11px]"
            >
              <Shield className="h-3 w-3" />
              Ubah Role
            </button>
            <button
              type="button"
              disabled
              title="Nonaktifkan akan ditambahkan setelah dukungan backend siap"
              className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-400"
            >
              <Clock className="h-3 w-3" />
              Nonaktifkan
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500 dark:bg-slate-900 dark:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
              Hapus
            </button>
          </div>
        </div>
      )}

      {filtersOpen && (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, email, atau nomor HP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-9 py-2.5 text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Bersihkan pencarian"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="uppercase tracking-wide">Role</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["ALL", "USER", "ADMIN"].map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    roleFilter === role
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="uppercase tracking-wide">Tipe User</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: "ALL", label: "Semua" },
                { value: "REGISTERED", label: "Punya akun (login)" },
                { value: "GUEST_ONLY", label: "Guest (tanpa login)" },
              ].map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAuthFilter(item.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    authFilter === item.value
                      ? "bg-emerald-600 text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="uppercase tracking-wide">Status</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { value: "ALL", label: "Semua" },
                { value: "ACTIVE", label: "Active" },
                { value: "INACTIVE", label: "Inactive" },
                { value: "SUSPENDED", label: "Suspended" },
              ].map(item => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatusFilter(item.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    statusFilter === item.value
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDateFilters(prev => !prev)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Filter tanggal dan waktu</span>
            </span>
            <span className="inline-flex items-center gap-2">
              {(dateFrom ||
                dateTo ||
                monthFilter !== "ALL" ||
                yearFilter !== "ALL" ||
                timeFrom ||
                timeTo) && (
                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                  Aktif
                </span>
              )}
              {showDateFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          </button>

          <AnimatePresence>
            {showDateFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label
                        htmlFor="user-date-from"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Date From
                      </label>
                      <input
                        id="user-date-from"
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="user-date-to"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Date To
                      </label>
                      <input
                        id="user-date-to"
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        min={dateFrom || undefined}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="user-month-filter"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Month
                      </label>
                      <select
                        id="user-month-filter"
                        value={monthFilter}
                        onChange={e => setMonthFilter(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      >
                        <option value="ALL">All Months</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="user-year-filter"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Year
                      </label>
                      <select
                        id="user-year-filter"
                        value={yearFilter}
                        onChange={e => setYearFilter(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      >
                        <option value="ALL">All Years</option>
                        {availableYears.map(year => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label
                        htmlFor="user-time-from"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        Time From
                      </label>
                      <input
                        id="user-time-from"
                        type="time"
                        value={timeFrom}
                        onChange={e => setTimeFrom(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="user-time-to"
                        className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        Time To
                      </label>
                      <input
                        id="user-time-to"
                        type="time"
                        value={timeTo}
                        onChange={e => setTimeTo(e.target.value)}
                        min={timeFrom || undefined}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50"
                      />
                    </div>
                  </div>

                  {(dateFrom ||
                    dateTo ||
                    monthFilter !== "ALL" ||
                    yearFilter !== "ALL" ||
                    timeFrom ||
                    timeTo) && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setDateFrom("");
                          setDateTo("");
                          setMonthFilter("ALL");
                          setYearFilter("ALL");
                          setTimeFrom("");
                          setTimeTo("");
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <X className="h-3 w-3" />
                        Reset filter tanggal
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto" aria-label="Dismiss error">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-12 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="max-h-[540px] overflow-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                        checked={
                          paginatedUsers.length > 0 &&
                          paginatedUsers.every(user =>
                            selectedUserIds.includes(user.id),
                          )
                        }
                        onChange={toggleSelectAllCurrentPage}
                      />
                    </th>
                    <th className="px-4 py-3 text-left align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("name")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                      >
                        <span>Nama</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("email")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                      >
                        <span>Email</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left align-middle">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-200">
                        No HP
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left align-middle">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-200">
                        Alamat utama
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("role")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                      >
                        <span>Role</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left align-middle">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-200">
                        Status
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left align-middle">
                      <button
                        type="button"
                        onClick={() => handleSort("created_at")}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
                      >
                        <span>Tanggal Daftar</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="w-32 px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-200">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(user => {
                    const statusInfo = getUserStatusDisplay(user);
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-slate-100 text-xs text-slate-700 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-2.5 align-middle">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => toggleSelectUser(user.id)}
                          />
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                              {user.full_name[0]?.toUpperCase() || "?"}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-xs font-semibold text-slate-900 dark:text-slate-50">
                                {user.full_name}
                              </div>
                              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                ID {formatUserDisplayId(user.id)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          {user.role === "ADMIN" ? (
                            <div className="truncate text-xs text-slate-700 dark:text-slate-100">
                              {user.email}
                            </div>
                          ) : (
                            <div className="truncate text-xs text-slate-400 italic dark:text-slate-500">
                              Email disembunyikan
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="truncate text-xs text-slate-700 dark:text-slate-100">
                            {user.phone_number}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          {user.primary_address ? (
                            <div className="truncate text-xs text-slate-700 dark:text-slate-100">
                              {user.primary_address}
                            </div>
                          ) : (
                            <div className="truncate text-[11px] text-slate-400 italic dark:text-slate-500">
                              Belum ada alamat
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                user.role === "ADMIN"
                                  ? "border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-200"
                                  : "border border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200"
                              }`}
                            >
                              {user.role}
                            </span>
                            {user.role === "USER" && user.auth_type === "REGISTERED" && (
                              <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-200">
                                Login
                              </span>
                            )}
                            {user.role === "USER" && user.auth_type === "GUEST_ONLY" && (
                              <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-500 dark:bg-slate-800/40 dark:text-slate-200">
                                Guest (tanpa login)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 align-middle">
                          <div className="text-xs text-slate-700 dark:text-slate-100">
                            {formatDateOnlyWITA(user.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-right align-middle">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openDetailModal(user)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                              title="Lihat detail"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetPassword(user.id)}
                              disabled={busy}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                              title="Reset password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={busy}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500 dark:bg-slate-900 dark:text-red-400"
                              title="Hapus"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-3 md:hidden">
            {paginatedUsers.map(user => {
              const statusInfo = getUserStatusDisplay(user);
              const isOpen = openActionUserId === user.id;
              return (
                <div
                  key={user.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                    />
                    <div className="flex flex-1 items-start gap-3">
                      <button
                        type="button"
                        onClick={() => openDetailModal(user)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {user.full_name[0]?.toUpperCase() || "?"}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {user.full_name}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  user.role === "ADMIN"
                                    ? "border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-900/30 dark:text-amber-200"
                                    : "border border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-200"
                                }`}
                              >
                                {user.role}
                              </span>
                              {user.role === "USER" && user.auth_type === "REGISTERED" && (
                                <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/30 dark:text-emerald-200">
                                  Login
                                </span>
                              )}
                              {user.role === "USER" && user.auth_type === "GUEST_ONLY" && (
                                <span className="inline-flex items-center rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:border-slate-500 dark:bg-slate-800/40 dark:text-slate-200">
                                  Guest
                                </span>
                              )}
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusInfo.className}`}
                              >
                                {statusInfo.label}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionUserId(isOpen ? null : user.id)
                            }
                            className="ml-2 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                            aria-label="Tindakan lainnya"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          {user.role === "ADMIN" && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">{user.phone_number}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate">
                              Terdaftar {formatDateOnlyWITA(user.created_at)}
                            </span>
                          </div>
                          {user.primary_address && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 text-slate-400" />
                              <span className="line-clamp-2 text-[11px]">
                                {user.primary_address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openDetailModal(user)}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Lihat detail
                  </button>

                  {isOpen && (
                    <div className="mt-2 flex flex-wrap gap-2 border-t border-slate-100 pt-2 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(user.id)}
                        disabled={busy}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <KeyRound className="h-3.5 w-3.5" />
                        Reset password
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={busy}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-500 dark:bg-slate-900 dark:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && paginatedUsers.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center"
        >
          <Users className="h-12 w-12 text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-600">
            {users.length === 0 ? "No users yet" : "No users match your filters"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {users.length === 0 ? "Belum ada pengguna, tambahkan dari tombol di atas" : "Coba sesuaikan filter pencarian"}
          </p>
        </motion.div>
      )}

      {/* Pagination */}
      {filteredUsers.length > itemsPerPage && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-slate-200 bg-white p-4"
        >
          <div className="text-sm font-semibold text-slate-600">
            Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} dari {filteredUsers.length} pengguna
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Sebelumnya
            </motion.button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(page)}
                  className={`h-8 w-8 rounded-lg text-sm font-bold transition-colors ${
                    currentPage === page
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {page}
                </motion.button>
              ))}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Berikutnya
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Add/Edit User Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">
                  {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                </h2>
                <button onClick={closeModals} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <div className="mb-1.5 text-xs font-bold text-slate-700">Nama Lengkap</div>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="Nama lengkap"
                  />
                </label>

                <label className="block">
                  <div className="mb-1.5 text-xs font-bold text-slate-700">Email</div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="user@example.com"
                  />
                </label>

                <label className="block">
                  <div className="mb-1.5 text-xs font-bold text-slate-700">Nomor WhatsApp</div>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="08xxxxxxxxxx"
                  />
                </label>

                {!editingUser && (
                  <label className="block">
                    <div className="mb-1.5 text-xs font-bold text-slate-700">Password</div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                      placeholder="Minimal 6 karakter"
                    />
                  </label>
                )}

                <label className="block">
                  <div className="mb-1.5 text-xs font-bold text-slate-700">Peran</div>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as "USER" | "ADMIN" })}
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
              </div>

              <div className="mt-5 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={closeModals}
                  className="flex-1 rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition-all hover:bg-slate-50"
                >
                  Batal
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={editingUser ? handleEditUser : handleAddUser}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2">
                    {busy ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        {editingUser ? "Menyimpan..." : "Membuat..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingUser ? "Simpan" : "Buat"}
                      </>
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Detail Modal - Premium Design (Responsive Bottom Sheet on Mobile) */}
      <AnimatePresence>
        {showDetailModal && selectedUser && (
          <>
            {/* Backdrop with blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md"
              onClick={closeModals}
            />
            
            {/* Modal Container - Bottom Sheet on Mobile, Centered on Desktop with offset */}
            <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-4 sm:pt-20">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                onClick={e => e.stopPropagation()}
                className="pointer-events-auto mb-20 flex max-h-[82vh] w-full flex-col rounded-t-3xl border-t bg-white shadow-xl sm:mb-0 sm:max-w-lg sm:rounded-2xl sm:border sm:bg-slate-950/95 sm:text-slate-50"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 sm:px-6 sm:py-4 sm:border-slate-800">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900 sm:text-base sm:text-slate-50">
                      Detail Pengguna
                    </h2>
                    <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs sm:text-slate-400">
                      Informasi akun dan aktivitas dasar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeModals}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 sm:border-slate-600 sm:text-slate-300 sm:hover:bg-slate-800"
                    aria-label="Tutup detail pengguna"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-4 sm:px-6 sm:pt-5 sm:pb-3 scrollbar-thin scrollbar-thumb-slate-200 sm:scrollbar-thumb-slate-700">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 sm:bg-slate-800 sm:text-slate-100">
                        {selectedUser.full_name[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="text-sm font-semibold text-slate-900 sm:text-slate-50">
                          {selectedUser.full_name}
                        </div>
                        <div className="space-y-1 text-xs text-slate-600 sm:text-slate-300">
                          {selectedUser.role === "ADMIN" && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" />
                              <span className="truncate">{selectedUser.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="truncate">
                              {selectedUser.phone_number}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:border-slate-700 sm:bg-slate-900">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-slate-400">
                          Role
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-900 sm:text-slate-50">
                            {selectedUser.role}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs sm:border-slate-700 sm:bg-slate-900">
                        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-slate-400">
                          Tanggal daftar
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-900 sm:text-slate-50">
                          {formatDateOnlyWITA(selectedUser.created_at)}
                        </div>
                      </div>
                    </div>

                    {(addressName || (selectedUser.primary_address_latitude && selectedUser.primary_address_longitude)) && (
                      <div className="rounded-lg border border-slate-200 bg-white text-xs sm:border-slate-700 sm:bg-slate-900 sm:text-slate-100">
                        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 sm:border-slate-700">
                          <MapPin className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-[11px] font-semibold text-slate-700 sm:text-slate-200">
                            Lokasi utama
                          </span>
                        </div>
                        <div className="space-y-3 px-3 py-3">
                          <div className="text-xs leading-relaxed text-slate-700 sm:text-slate-200">
                            {isLoadingAddress ? (
                              <span className="text-slate-400">
                                Mencari alamat lokasi...
                              </span>
                            ) : addressName ? (
                              <span>{addressName}</span>
                            ) : (
                              <span className="font-mono text-[11px] text-slate-500 sm:text-slate-400">
                                {selectedUser.primary_address_latitude?.toFixed(6)},{" "}
                                {selectedUser.primary_address_longitude?.toFixed(6)}
                              </span>
                            )}
                          </div>
                          {selectedUserMapsUrl && (
                            <>
                              <a
                                href={selectedUserMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 sm:border-slate-600 sm:bg-slate-800 sm:text-slate-100 sm:hover:bg-slate-700"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Buka di Google Maps
                              </a>
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(selectedUserMapsUrl);
                                    setSuccessMessage("Link alamat disalin");
                                  } catch {
                                    setSuccessMessage("Gagal menyalin link alamat");
                                  }
                                }}
                                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:border-slate-600 sm:bg-slate-900 sm:text-slate-100 sm:hover:bg-slate-800"
                              >
                                <Copy className="h-3 w-3" />
                                Salin link alamat
                              </button>
                            </>
                          )}
                          {selectedUser.primary_address_notes && (
                            <div className="rounded-md bg-slate-50 px-3 py-2 text-[11px] text-slate-600 sm:bg-slate-800/40 sm:text-slate-200">
                              Detail rumah: {selectedUser.primary_address_notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="safe-area-bottom flex shrink-0 gap-2 border-t border-slate-200 bg-white px-3 pb-5 pt-3 sm:gap-3 sm:border-slate-800 sm:bg-slate-950 sm:px-4 sm:pb-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      closeModals();
                      openEditModal(selectedUser);
                    }}
                    className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg bg-slate-900 py-2.5 text-[11px] font-semibold text-white hover:bg-slate-800 sm:text-xs"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span className="tracking-wide">Edit</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      closeModals();
                      handleResetPassword(selectedUser.id);
                    }}
                    disabled={busy}
                    className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-300 bg-white py-2.5 text-[11px] font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 sm:text-xs sm:border-slate-600 sm:bg-slate-900 sm:text-slate-50 sm:hover:bg-slate-800"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span className="tracking-wide">Reset password</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeModals}
                    className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-white py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 sm:text-xs sm:border-slate-600 sm:bg-slate-900 sm:text-slate-100 sm:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                    <span className="tracking-wide">Tutup</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Success Alert - Positioned below navbar */}
      <SuccessAlert
        isVisible={!!successMessage}
        message={successMessage || ""}
        onClose={() => setSuccessMessage(null)}
        duration={5000}
        topOffset={80}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Hapus Pengguna?"
        message={
          userToDelete
            ? `Yakin ingin menghapus pengguna "${users.find(u => u.id === userToDelete)?.full_name || `#${userToDelete}`}"? Tindakan ini tidak dapat dibatalkan dan semua data terkait akan dihapus permanen.`
            : "Yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
        }
        confirmText="Ya, hapus pengguna"
        cancelText="Batal"
        variant="danger"
        isLoading={busy}
      />

      {/* Reset Password Dialog with Custom Password Option */}
      <AnimatePresence>
        {showResetPasswordDialog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!busy) {
                  setShowResetPasswordDialog(false);
                  setUserToResetPassword(null);
                  setCustomPassword("");
                  setUseCustomPassword(false);
                }
              }}
              className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-sm"
            />
            
            {/* Dialog */}
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md pointer-events-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="border-b border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-black text-slate-900">
                        Reset password
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowResetPasswordDialog(false);
                        setUserToResetPassword(null);
                        setCustomPassword("");
                        setUseCustomPassword(false);
                      }}
                      disabled={busy}
                      className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Reset password untuk{" "}
                    <span className="font-black text-slate-900">
                      {userToResetPassword
                        ? users.find(u => u.id === userToResetPassword)?.full_name ||
                          `Pengguna #${userToResetPassword}`
                        : "pengguna ini"}
                    </span>
                  </p>

                  {/* Custom Password Option */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomPassword}
                        onChange={(e) => {
                          setUseCustomPassword(e.target.checked);
                          if (!e.target.checked) {
                            setCustomPassword("");
                          }
                        }}
                        disabled={busy}
                        className="h-4 w-4 rounded border-2 border-slate-300 text-slate-700 focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                      />
                      <span className="text-sm font-semibold text-slate-700">Gunakan password kustom</span>
                    </label>

                    {useCustomPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <label className="block">
                          <div className="mb-1.5 text-xs font-bold text-slate-700">Password kustom</div>
                          <input
                            type="text"
                            value={customPassword}
                            onChange={(e) => setCustomPassword(e.target.value)}
                            disabled={busy}
                            placeholder="Masukkan password kustom (min. 6 karakter)"
                            className="w-full rounded-lg border-2 border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none disabled:opacity-50"
                          />
                          {customPassword && customPassword.length < 6 && (
                            <p className="mt-1 text-xs text-amber-600 font-medium">
                              Password minimal 6 karakter
                            </p>
                          )}
                        </label>
                      </motion.div>
                    )}

                    {!useCustomPassword && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold text-slate-700">
                          Sistem akan membuat password acak 8 karakter secara otomatis.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-slate-200 p-5 pt-0">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowResetPasswordDialog(false);
                      setUserToResetPassword(null);
                      setCustomPassword("");
                      setUseCustomPassword(false);
                    }}
                    disabled={busy}
                  className="flex-1 rounded-lg border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                    Batal
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmResetPassword}
                    disabled={busy || (useCustomPassword && customPassword.length < 6)}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        Mengatur ulang...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Reset Password Result Modal */}
      <AnimatePresence>
        {resetPasswordResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setResetPasswordResult(null)}
          >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
              >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <KeyRound className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Reset Password Berhasil</h2>
                </div>
                <button 
                  onClick={() => setResetPasswordResult(null)} 
                  className="text-slate-400 hover:text-slate-600" 
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">
                  Password telah direset untuk{" "}
                  <span className="font-black text-slate-900">
                    {resetPasswordResult.userName}
                  </span>
                </p>
                
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                    Password baru
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-black text-slate-900">
                      {resetPasswordResult.newPassword}
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(resetPasswordResult.newPassword);
                          setSuccessMessage("Password berhasil disalin ke clipboard");
                        } catch (err) {
                          setError("Gagal menyalin password ke clipboard");
                        }
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white transition-colors hover:bg-slate-800"
                      title="Salin password"
                    >
                      <Save className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600">
                  Harap kirimkan password ini ke pengguna dengan cara yang aman.
                  Mereka sebaiknya mengganti password setelah login.
                </div>
              </div>

                <div className="mt-5">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setResetPasswordResult(null)}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-black text-white shadow-sm transition-colors hover:bg-blue-700"
                  >
                    Tutup
                  </motion.button>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
