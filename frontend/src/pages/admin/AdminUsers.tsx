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
} from "lucide-react";

import { api } from "../../lib/api";
import { getApiErrorMessage } from "../../lib/apiError";
import { AnimatedCard } from "../../components/AnimatedCard";
import { toAbsoluteUrl } from "../../lib/urls";
import { normalizeWhatsAppPhone } from "../../lib/phone";
import { formatDateOnlyWITA } from "../../utils/date";
import { SuccessAlert } from "../../components/SuccessAlert";
import { ConfirmDialog } from "../../components/ConfirmDialog";

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

  // Address state for detail modal
  const [addressName, setAddressName] = useState<string | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // Fetch address when selected user changes
  useEffect(() => {
    if (selectedUser?.default_latitude && selectedUser?.default_longitude) {
      setIsLoadingAddress(true);
      // Use OpenStreetMap Nominatim for reverse geocoding
      // NOTE: We do not set User-Agent header as it is forbidden in browser fetch and causes CORS issues.
      // Instead we pass email param as requested by Nominatim usage policy.
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedUser.default_latitude}&lon=${selectedUser.default_longitude}&zoom=18&addressdetails=1&accept-language=id&email=admin@lokaclean.com`)
        .then(res => {
           if (!res.ok) throw new Error("Network response was not ok");
           return res.json();
        })
        .then(data => {
          setAddressName(data.display_name || null);
        })
        .catch((err) => {
           console.error("Address fetch error:", err);
           setAddressName(null);
        })
        .finally(() => setIsLoadingAddress(false));
    } else {
      setAddressName(null);
    }
  }, [selectedUser?.id, selectedUser?.default_latitude, selectedUser?.default_longitude]);

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
    
    return matchesSearch && matchesRole && matchesDate;
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

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, dateFrom, dateTo, monthFilter, yearFilter, timeFrom, timeTo]);

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
      setSuccessMessage(`User "${formData.full_name}" created successfully!`);
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
      setSuccessMessage(`User "${formData.full_name}" updated successfully!`);
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
      setSuccessMessage(`User "${user?.full_name || `#${userToDelete}`}" deleted successfully!`);
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
      setError("Password must be at least 6 characters");
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
        userName: user?.full_name || `User #${userToResetPassword}`
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
    <div className="space-y-4 animate-fade-in">
      {/* Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 sm:h-8 sm:w-8 text-indigo-600" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                Users
              </h1>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="inline-flex items-center justify-center min-w-[28px] h-7 px-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-black shadow-md shadow-indigo-500/30"
              >
                {filteredUsers.length}
              </motion.span>
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium">Manage user accounts and permissions</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingUser(null);
            setFormData({ full_name: "", email: "", phone_number: "", password: "", role: "USER" });
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-black text-white shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Add
        </motion.button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm font-semibold text-slate-900 placeholder-slate-400 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Filter className="h-4 w-4" />
            Role:
          </div>
          {["ALL", "USER", "ADMIN"].map((role) => (
            <motion.button
              key={role}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                roleFilter === role
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {role}
            </motion.button>
          ))}
        </div>

        {/* Date/Time Filter Toggle Button - Mobile Friendly */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowDateFilters(!showDateFilters)}
          className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-bold transition-all ${
            showDateFilters || dateFrom || dateTo || monthFilter !== "ALL" || yearFilter !== "ALL" || timeFrom || timeTo
              ? "border-indigo-300 bg-indigo-50 text-indigo-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Date & Time Filters</span>
            {(dateFrom || dateTo || monthFilter !== "ALL" || yearFilter !== "ALL" || timeFrom || timeTo) && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                {(dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (monthFilter !== "ALL" ? 1 : 0) + (yearFilter !== "ALL" ? 1 : 0) + (timeFrom ? 1 : 0) + (timeTo ? 1 : 0)}
              </span>
            )}
          </div>
          {showDateFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </motion.button>

        {/* Date and Time Filters - Collapsible */}
        <AnimatePresence>
          {showDateFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Date From */}
                  <div>
                    <label htmlFor="user-date-from" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Date From
                    </label>
                    <input
                      id="user-date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    {dateFrom && (
                      <button
                        onClick={() => setDateFrom("")}
                        className="mt-1 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Clear date from"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Date To */}
                  <div>
                    <label htmlFor="user-date-to" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Date To
                    </label>
                    <input
                      id="user-date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      min={dateFrom || undefined}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    {dateTo && (
                      <button
                        onClick={() => setDateTo("")}
                        className="mt-1 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Clear date to"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Month Filter */}
                  <div>
                    <label htmlFor="user-month-filter" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Month
                    </label>
                    <select
                      id="user-month-filter"
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    >
                      <option value="ALL">All Months</option>
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label htmlFor="user-year-filter" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      Year
                    </label>
                    <select
                      id="user-year-filter"
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    >
                      <option value="ALL">All Years</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year.toString()}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid gap-3 sm:grid-cols-2 sm:col-span-2 lg:col-span-4">
                  <div>
                    <label htmlFor="user-time-from" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      Time From
                    </label>
                    <input
                      id="user-time-from"
                      type="time"
                      value={timeFrom}
                      onChange={(e) => setTimeFrom(e.target.value)}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    {timeFrom && (
                      <button
                        onClick={() => setTimeFrom("")}
                        className="mt-1 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Clear time from"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div>
                    <label htmlFor="user-time-to" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      Time To
                    </label>
                    <input
                      id="user-time-to"
                      type="time"
                      value={timeTo}
                      onChange={(e) => setTimeTo(e.target.value)}
                      min={timeFrom || undefined}
                      className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    />
                    {timeTo && (
                      <button
                        onClick={() => setTimeTo("")}
                        className="mt-1 text-xs text-slate-500 hover:text-slate-700"
                        aria-label="Clear time to"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Clear All Date/Time Filters Button */}
                  {(dateFrom || dateTo || monthFilter !== "ALL" || yearFilter !== "ALL" || timeFrom || timeTo) && (
                    <div className="sm:col-span-2 lg:col-span-4 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setDateFrom("");
                          setDateTo("");
                          setMonthFilter("ALL");
                          setYearFilter("ALL");
                          setTimeFrom("");
                          setTimeTo("");
                        }}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-slate-300 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-100"
                      >
                        <X className="h-4 w-4" />
                        Clear All Date/Time Filters
                      </motion.button>
                    </div>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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

      {/* Compact User Cards - Mobile Friendly */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-5">
          <AnimatePresence mode="wait">
            {paginatedUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
                className="group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-3 shadow-sm transition-all hover:border-indigo-300/60 hover:shadow-md hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  {/* Profile Photo - Compact and Professional */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openDetailModal(user)}
                    className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-purple-50 cursor-pointer shadow-sm hover:shadow-md transition-all"
                  >
                    {user.profile_photo ? (
                      <img
                        src={toAbsoluteUrl(user.profile_photo) || undefined}
                        alt={user.full_name}
                        className="h-full w-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector(".photo-placeholder")) {
                            const placeholder = document.createElement("div");
                            placeholder.className = "photo-placeholder flex h-full w-full items-center justify-center";
                            placeholder.innerHTML = `<div class="text-lg sm:text-xl font-black text-indigo-600">${user.full_name[0]?.toUpperCase() || "?"}</div>`;
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-500" />
                      </div>
                    )}
                    {user.role === "ADMIN" && (
                      <div className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm border border-white">
                        <Shield className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </motion.div>

                  {/* User Info - Compact and Professional */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{user.full_name}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        user.role === "ADMIN" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {user.role}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Mail className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Phone className="h-3 w-3 text-blue-500 flex-shrink-0" />
                        <span className="truncate">{user.phone_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Compact */}
                  <div className="flex items-center gap-1.5">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openDetailModal(user)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all hover:bg-blue-100"
                      title="View Details"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => openEditModal(user)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition-all hover:bg-indigo-100"
                      title="Edit User"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleResetPassword(user.id)}
                      disabled={busy}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-all hover:bg-amber-100 disabled:opacity-50"
                      title="Reset Password"
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={busy}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
                      title="Delete User"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
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
            {users.length === 0 ? "Add your first user above" : "Try adjusting your filters"}
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
            Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
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
              Previous
            </motion.button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <motion.button
                  key={page}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                    currentPage === page
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
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
              Next
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
                  {editingUser ? "Edit User" : "Add New User"}
                </h2>
                <button onClick={closeModals} className="text-slate-400 hover:text-slate-600" aria-label="Close modal">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <div className="mb-1.5 text-xs font-bold text-slate-700">Full Name</div>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="John Doe"
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
                  <div className="mb-1.5 text-xs font-bold text-slate-700">Phone Number</div>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    placeholder="+628123456789"
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
                      placeholder="Min. 6 characters"
                    />
                  </label>
                )}

                <label className="block">
                  <div className="mb-1.5 text-xs font-bold text-slate-700">Role</div>
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
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={editingUser ? handleEditUser : handleAddUser}
                  disabled={busy}
                  className="group relative flex-1 overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{
                      x: ["-100%", "200%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "linear",
                    }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {busy ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        {editingUser ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {editingUser ? "Save" : "Create"}
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
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl pointer-events-auto overflow-hidden max-h-[85vh] sm:max-h-[85vh] flex flex-col sm:mt-10"
              >
                {/* Premium Header */}
                <div className="relative shrink-0">
                   {/* Decorative background pattern */}
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 opacity-100" />
                   <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-20" />
                   
                   {/* Content */}
                   <div className="relative p-5 pt-4 pb-14 sm:p-6 sm:pt-6 sm:pb-16 flex items-start justify-between">
                      <div className="text-white w-full text-center pr-8 pl-8">
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-1">User Details</h2>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={closeModals}
                        className="absolute right-5 top-4 sm:right-6 sm:top-6 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors backdrop-blur-md"
                      >
                        <X className="h-5 w-5" />
                      </motion.button>
                   </div>

                   {/* Profile Photo - Centered Floating Overlap */}
                   <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden cursor-pointer group"
                        onClick={() => selectedUser.profile_photo && window.open(toAbsoluteUrl(selectedUser.profile_photo) || "", "_blank")}
                      >
                        {selectedUser.profile_photo ? (
                          <img
                            src={toAbsoluteUrl(selectedUser.profile_photo) || undefined}
                            alt={selectedUser.full_name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-500">
                            <User className="h-10 w-10 sm:h-12 sm:w-12" />
                          </div>
                        )}
                        
                        {/* Status Indicator */}
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm py-1 text-center">
                           <span className="text-[8px] sm:text-[9px] font-bold text-white uppercase tracking-wider block">
                             {selectedUser.role}
                           </span>
                        </div>
                      </motion.div>
                   </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 pt-12 sm:p-6 sm:pt-14 pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                  <div className="space-y-3">
                    {/* Name & Contact Section - Centered */}
                    <div className="space-y-1 mb-4 sm:mb-5 text-center">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">{selectedUser.full_name}</h3>
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                          <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-indigo-500" />
                          {selectedUser.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
                          <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                          {selectedUser.phone_number}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-amber-100 text-amber-600 mb-1">
                          <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-0.5">Role Access</span>
                        <div className="text-xs sm:text-sm font-black text-slate-900">{selectedUser.role}</div>
                      </div>
                      
                      <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 text-purple-600 mb-1">
                          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-0.5">Joined Date</span>
                        <div className="text-xs sm:text-sm font-black text-slate-900">{formatDateOnlyWITA(selectedUser.created_at)}</div>
                      </div>
                    </div>

                    {/* Location Card */}
                    {(selectedUser.default_latitude && selectedUser.default_longitude) && (
                      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
                           <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500" />
                           <span className="text-[10px] sm:text-xs font-bold text-slate-700 uppercase">Default Location</span>
                        </div>
                        <div className="p-3 sm:p-4 bg-white">
                           <div className="text-xs sm:text-sm font-medium text-slate-800 mb-3 leading-relaxed break-words whitespace-pre-wrap text-left">
                             {isLoadingAddress ? (
                               <div className="flex items-center gap-2 text-slate-400">
                                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-3 w-3 rounded-full border-2 border-slate-300 border-t-slate-500" />
                                  Finding address...
                               </div>
                             ) : (
                               addressName ? (
                                 <span>{addressName}</span>
                               ) : (
                                 <span className="font-mono text-slate-500 text-[10px] sm:text-xs">
                                   {selectedUser.default_latitude.toFixed(6)}, {selectedUser.default_longitude.toFixed(6)}
                                 </span>
                               )
                             )}
                           </div>
                           <a
                             href={`https://www.google.com/maps/search/?api=1&query=${selectedUser.default_latitude},${selectedUser.default_longitude}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 border border-slate-200 py-2 sm:py-2.5 text-[10px] sm:text-xs font-bold text-slate-700 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 hover:shadow-md active:scale-95"
                           >
                             <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                             Open in Google Maps
                           </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions - Sticky Bottom */}
                <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex gap-2 sm:gap-3 shrink-0 pb-6 sm:pb-4 safe-area-bottom">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      closeModals();
                      openEditModal(selectedUser);
                    }}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-xl bg-indigo-50 py-2.5 sm:py-3 text-indigo-700 transition-all hover:bg-indigo-100 active:bg-indigo-200"
                  >
                    <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide">Edit</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      closeModals();
                      handleResetPassword(selectedUser.id);
                    }}
                    disabled={busy}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-xl bg-amber-50 py-2.5 sm:py-3 text-amber-700 transition-all hover:bg-amber-100 active:bg-amber-200 disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide">Reset Pass</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={closeModals}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-xl bg-slate-50 py-2.5 sm:py-3 text-slate-700 transition-all hover:bg-slate-100 active:bg-slate-200"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wide">Close</span>
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
        title="Delete User?"
        message={
          userToDelete
            ? `Are you sure you want to delete user "${users.find(u => u.id === userToDelete)?.full_name || `#${userToDelete}`}"? This action cannot be undone and all related data will be permanently deleted.`
            : "Are you sure you want to delete this user? This action cannot be undone."
        }
        confirmText="Yes, Delete User"
        cancelText="Cancel"
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
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 border-b border-amber-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                        <KeyRound className="h-5 w-5 text-amber-600" />
                      </div>
                      <h2 className="text-lg font-black text-slate-900">Reset Password</h2>
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
                    Reset password for <span className="font-black text-slate-900">
                      {userToResetPassword ? users.find(u => u.id === userToResetPassword)?.full_name || `User #${userToResetPassword}` : "this user"}
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
                        className="h-4 w-4 rounded border-2 border-amber-300 text-amber-600 focus:ring-2 focus:ring-amber-200 disabled:opacity-50"
                      />
                      <span className="text-sm font-semibold text-slate-700">Use custom password</span>
                    </label>

                    {useCustomPassword && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                      >
                        <label className="block">
                          <div className="mb-1.5 text-xs font-bold text-slate-700">Custom Password</div>
                          <input
                            type="text"
                            value={customPassword}
                            onChange={(e) => setCustomPassword(e.target.value)}
                            disabled={busy}
                            placeholder="Enter custom password (min. 6 characters)"
                            className="w-full rounded-lg border-2 border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none disabled:opacity-50"
                          />
                          {customPassword && customPassword.length < 6 && (
                            <p className="mt-1 text-xs text-amber-600 font-medium">
                              Password must be at least 6 characters
                            </p>
                          )}
                        </label>
                      </motion.div>
                    )}

                    {!useCustomPassword && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                        <p className="text-xs font-semibold text-amber-700">
                          A random 8-character password will be generated automatically.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-0 flex gap-2 border-t border-slate-200/50">
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
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={confirmResetPassword}
                    disabled={busy || (useCustomPassword && customPassword.length < 6)}
                    className="flex-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                        />
                        Resetting...
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
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border-2 border-amber-200 bg-white p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <KeyRound className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Password Reset Successful</h2>
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
                  Password has been reset for <span className="font-black text-slate-900">{resetPasswordResult.userName}</span>
                </p>
                
                <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
                  <div className="mb-2 text-xs font-bold text-amber-700 uppercase tracking-wide">New Password</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-white px-3 py-2 text-base font-black text-slate-900 border border-amber-200">
                      {resetPasswordResult.newPassword}
                    </code>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(resetPasswordResult.newPassword);
                          setSuccessMessage("Password copied to clipboard!");
                        } catch (err) {
                          setError("Failed to copy password to clipboard");
                        }
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600 text-white transition-all hover:bg-amber-700"
                      title="Copy password"
                    >
                      <Save className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600">
                    ⚠️ Please share this password with the user securely. They should change it after logging in.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setResetPasswordResult(null)}
                  className="w-full rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2.5 text-sm font-black text-white shadow-lg transition-all hover:shadow-xl"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
