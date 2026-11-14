import { useEffect } from "react";
import { LogOut, X } from "lucide-react";
import { motion } from "framer-motion";

export default function LogoutConfirmModal({ onCancel, onConfirm }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#202a20]/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#dceacb] bg-white shadow-[0_24px_70px_rgba(32,42,32,0.25)]"
      >
        <div className="flex items-start gap-3 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f8ecea] text-[#b35a54]">
            <LogOut className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="logout-dialog-title"
              className="text-base font-black text-[#202a20]"
            >
              Confirm logout
            </h2>
            <p
              id="logout-dialog-description"
              className="mt-1 text-sm leading-5 text-[#667065]"
            >
              Are you sure you want to log out of your account?
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close logout confirmation"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#92998e] transition hover:bg-[#f3f5f1] hover:text-[#202a20]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#edf1e9] bg-[#fdfefd] px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-xl border border-[#dceacb] bg-white px-4 text-xs font-bold text-[#667065] transition hover:bg-[#eef5e7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#b35a54] px-4 text-xs font-bold text-white transition hover:bg-[#9f4b46]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Yes, log out
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}
