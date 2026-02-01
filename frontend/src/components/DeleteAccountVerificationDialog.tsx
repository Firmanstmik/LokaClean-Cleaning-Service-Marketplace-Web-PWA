/**
 * Delete Account Verification Dialog
 * Requires user to re-enter email/phone and password for security
 */

import { useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Eye, EyeOff, Mail, Phone, Lock } from "lucide-react";

interface DeleteAccountVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (emailOrPhone: string, password: string) => Promise<void>;
  userEmail: string;
  userPhone: string;
  currentLanguage: "id" | "en";
  isLoading?: boolean;
}

export function DeleteAccountVerificationDialog({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
  userPhone,
  currentLanguage,
  isLoading = false
}: DeleteAccountVerificationDialogProps) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);

    // Validate inputs
    if (!emailOrPhone.trim()) {
      setError(
        currentLanguage === "id"
          ? "Email atau nomor HP harus diisi"
          : "Email or phone number is required"
      );
      return;
    }

    if (!password) {
      setError(
        currentLanguage === "id"
          ? "Password harus diisi"
          : "Password is required"
      );
      return;
    }

    // Validate email/phone matches user's email or phone
    const normalizedInput = emailOrPhone.trim().toLowerCase();
    const normalizedEmail = userEmail.toLowerCase();
    const normalizedPhone = userPhone.replace(/\s+/g, "");

    if (
      normalizedInput !== normalizedEmail &&
      normalizedInput !== normalizedPhone &&
      normalizedInput !== userPhone
    ) {
      setError(
        currentLanguage === "id"
          ? "Email atau nomor HP tidak sesuai dengan akun Anda"
          : "Email or phone number does not match your account"
      );
      return;
    }

    try {
      await onConfirm(emailOrPhone.trim(), password);
      // Reset form on success
      setEmailOrPhone("");
      setPassword("");
      setError(null);
    } catch (err) {
      // Error handling is done by parent component
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmailOrPhone("");
      setPassword("");
      setError(null);
      onClose();
    }
  };

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm"
            style={{ position: 'fixed' }}
          />

          {/* Dialog Container */}
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                duration: 0.3
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md pointer-events-auto"
            >
              {/* Dialog Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Gradient accent top border */}
                <div className="h-1.5 bg-gradient-to-r from-rose-50 to-red-50" />

                {/* Content */}
                <div className="p-6 sm:p-8">
                  {/* Close Button */}
                  {!isLoading && (
                    <button
                      onClick={handleClose}
                      className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}

                  {/* Icon Container */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-rose-100 to-red-100 flex items-center justify-center"
                  >
                    <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-rose-600" />
                    
                    {/* Pulse animation */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-rose-100 to-red-100"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>

                  {/* Title */}
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-xl sm:text-2xl font-black text-slate-900 text-center mb-2"
                  >
                    {currentLanguage === "id"
                      ? "Verifikasi Identitas"
                      : "Verify Identity"}
                  </motion.h3>

                  {/* Message */}
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm sm:text-base text-slate-600 text-center leading-relaxed mb-6"
                  >
                    {currentLanguage === "id"
                      ? "Untuk keamanan, silakan masukkan email atau nomor HP dan password Anda untuk melanjutkan penghapusan akun."
                      : "For security, please enter your email or phone number and password to continue with account deletion."}
                  </motion.p>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 flex items-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                      >
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form Fields */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-4 mb-6"
                  >
                    {/* Email/Phone Input */}
                    <label className="block">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                        <Mail className="h-3.5 w-3.5 text-rose-500" />
                        {currentLanguage === "id"
                          ? "Email atau Nomor HP"
                          : "Email or Phone Number"}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={emailOrPhone}
                          onChange={(e) => {
                            setEmailOrPhone(e.target.value);
                            setError(null);
                          }}
                          disabled={isLoading}
                          placeholder={
                            currentLanguage === "id"
                              ? "Masukkan email atau nomor HP"
                              : "Enter email or phone number"
                          }
                          className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 pl-10 text-sm transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </label>

                    {/* Password Input */}
                    <label className="block">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                        <Lock className="h-3.5 w-3.5 text-rose-500" />
                        {currentLanguage === "id" ? "Password" : "Password"}
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError(null);
                          }}
                          disabled={isLoading}
                          placeholder={
                            currentLanguage === "id"
                              ? "Masukkan password"
                              : "Enter password"
                          }
                          className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 pr-10 text-sm transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 disabled:opacity-50"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </motion.button>
                      </div>
                    </label>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    {/* Cancel Button */}
                    <motion.button
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      onClick={handleClose}
                      disabled={isLoading}
                      className="flex-1 px-5 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-700 font-bold text-sm sm:text-base shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      {currentLanguage === "id" ? "Batal" : "Cancel"}
                    </motion.button>

                    {/* Confirm Button */}
                    <motion.button
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      onClick={handleConfirm}
                      disabled={isLoading || !emailOrPhone.trim() || !password}
                      className="flex-1 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-sm sm:text-base shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all disabled:opacity-60 disabled:cursor-not-allowed touch-manipulation relative overflow-hidden"
                    >
                      {isLoading ? (
                        <motion.div className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                          />
                          <span>
                            {currentLanguage === "id" ? "Memproses..." : "Processing..."}
                          </span>
                        </motion.div>
                      ) : (
                        currentLanguage === "id" ? "Hapus Akun" : "Delete Account"
                      )}
                      
                      {/* Shimmer effect on hover */}
                      {!isLoading && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: "-100%" }}
                          whileHover={{ x: "100%" }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                    </motion.button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

