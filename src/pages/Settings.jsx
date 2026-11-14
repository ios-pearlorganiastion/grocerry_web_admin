import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Lock,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Store,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Eye,
  EyeOff,
  ShoppingBag,
  Users,
  Truck,
  Sun,
  Moon,
  Monitor,
  CircleAlert,
  KeyRound,
  Check,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import changeStaffPassword from "../api/changePasswordController";

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

/* =========================================================
   FORM PIECES
========================================================= */

const inputWrapClass =
  "flex h-11 w-full min-w-0 items-center rounded-xl border border-[#dceacb] bg-[#f7f8f2] px-3 transition focus-within:border-[#315d32] focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(49,93,50,0.08)]";

const inputClass =
  "h-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#202a20] outline-none placeholder:font-normal placeholder:text-[#92998e] sm:text-sm";

const Field = ({ label, hint, children }) => (
  <div className="min-w-0">
    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#667065]">
      {label}
    </label>

    {children}

    {hint && <p className="mt-1 text-[10px] text-[#92998e]">{hint}</p>}
  </div>
);

const Input = ({
  value,
  onChange,
  type = "text",
  placeholder = "",
  icon: Icon,
  suffix,
}) => (
  <div className={inputWrapClass}>
    {Icon && <Icon className="mr-2 h-4 w-4 shrink-0 text-[#92998e]" />}

    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={inputClass}
    />

    {suffix}
  </div>
);

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);

  return (
    <Input
      type={show ? "password" : "text"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={Lock}
      suffix={
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          aria-label={show ? "Hide password" : "Show password"}
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#92998e] transition hover:bg-[#eef5e7] hover:text-[#315d32]"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      }
    />
  );
};

const Select = ({ value, onChange, children }) => (
  <div className="relative w-full min-w-0">
    <select
      value={value}
      onChange={onChange}
      className="h-11 w-full min-w-0 appearance-none rounded-xl border border-[#dceacb] bg-[#f7f8f2] px-3 pr-10 text-xs font-semibold text-[#202a20] outline-none transition focus:border-[#315d32] focus:bg-white focus:shadow-[0_0_0_4px_rgba(49,93,50,0.08)] sm:text-sm"
    >
      {children}
    </select>

    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#92998e]">
      <ChevronDown size={16} />
    </div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ${checked ? "bg-[#315d32]" : "bg-[#dfe5da]"
      }`}
  >
    <motion.span
      layout
      transition={{ type: "spring", stiffness: 500, damping: 32 }}
      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm ${checked ? "right-1" : "left-1"
        }`}
    />
  </button>
);

const SettingsCard = ({
  id,
  icon: Icon,
  title,
  description,
  children,
  className = "",
}) => (
  <motion.section
    id={id}
    variants={itemVariants}
    className={`group relative min-w-0 scroll-mt-24 overflow-hidden rounded-[18px] border border-[#dceacb] bg-white shadow-[0_8px_30px_rgba(49,93,50,0.06)] transition-all duration-300 hover:border-[#b8df7d] hover:shadow-[0_18px_45px_rgba(49,93,50,0.1)] sm:rounded-[24px] ${className}`}
  >
    <div className="flex min-w-0 items-center gap-3 border-b border-[#edf1e9] px-3.5 py-3.5 sm:px-5 sm:py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef5e7] text-[#315d32] transition-all duration-300 group-hover:bg-[#315d32] group-hover:text-white sm:h-11 sm:w-11">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <h2 className="truncate text-[13px] font-black tracking-tight text-[#202a20] sm:text-base">
          {title}
        </h2>

        <p className="mt-0.5 truncate text-[9px] text-[#92998e] sm:text-xs">
          {description}
        </p>
      </div>
    </div>

    <div className="min-w-0 p-3.5 sm:p-5">{children}</div>
  </motion.section>
);

/* Small group heading used inside cards to structure fields */
const SubHeading = ({ children }) => (
  <div className="mb-3 flex items-center gap-2">
    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-[#315d32]">
      {children}
    </span>
    <span className="h-px flex-1 bg-[#edf1e9]" />
  </div>
);

/* =========================================================
   PASSWORD HELPERS (UI only - no logic change in submit)
========================================================= */

const passwordRules = (pwd) => [
  { label: "At least 8 characters", ok: pwd.length >= 8 },
  { label: "One uppercase letter", ok: /[A-Z]/.test(pwd) },
  { label: "One number", ok: /\d/.test(pwd) },
  { label: "One special character", ok: /[^A-Za-z0-9]/.test(pwd) },
];

const STRENGTH_META = [
  { label: "Too weak", color: "#b35a54" },
  { label: "Weak", color: "#b35a54" },
  { label: "Fair", color: "#d9a441" },
  { label: "Good", color: "#7fb23f" },
  { label: "Strong", color: "#315d32" },
];

const THEME_OPTIONS = [
  ["Light", Sun],
  ["Dark", Moon],
  ["System", Monitor],
];

const NAV_ITEMS = [
  { id: "section-profile", label: "Admin Profile", icon: User },
  { id: "section-store", label: "Store Settings", icon: Store },
  { id: "section-security", label: "Security", icon: Lock },
];

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

/* =========================================================
   PAGE
========================================================= */

export default function Settings() {
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@example.com",
    phone: "+91 98765 43210",
  });

  const [store, setStore] = useState({
    name: "CD Shopping Hub",
    email: "support@example.com",
    phone: "+91 98765 43210",
    address: "Dehradun, Uttarakhand",
    radius: "10",
    commission: "10",
  });

  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    orders: true,
    customers: true,
    vendors: true,
    delivery: false,
  });

  const [preferences, setPreferences] = useState({
    language: "English",
    timezone: "Asia/Kolkata",
    theme: "Light",
  });

  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState("success");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const showToast = (message, type = "success") => {
    setToastType(type);
    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 2200);
  };

  const saveSettings = () => {
    console.log({
      profile,
      store,
      security,
      notifications,
      preferences,
    });

    showToast("Settings saved successfully");
  };

  const updatePassword = async () => {
    if (
      !security.currentPassword ||
      !security.newPassword ||
      !security.confirmPassword
    ) {
      showToast("Please fill in all password fields.", "error");
      return;
    }

    if (security.newPassword !== security.confirmPassword) {
      showToast("New password and confirmation do not match.", "error");
      return;
    }

    setIsChangingPassword(true);

    try {
      await changeStaffPassword(security);
      setSecurity({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      showToast("Password updated successfully.");
    } catch (error) {
      showToast(error.message || "Failed to change password.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const enabledNotifications = Object.values(notifications).filter(
    Boolean
  ).length;

  /* password UI helpers */
  const rules = passwordRules(security.newPassword);
  const passedRules = rules.filter((r) => r.ok).length;
  const strength = security.newPassword ? STRENGTH_META[passedRules] : null;
  const hasConfirm = security.confirmPassword.length > 0;
  const passwordsMatch =
    hasConfirm && security.newPassword === security.confirmPassword;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="show"
      className="box-border w-full min-w-0 max-w-full overflow-x-hidden bg-[#f7f8f2] pb-5 sm:pb-8"
    >
      <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-3 px-2 sm:space-y-5 sm:px-3 md:px-4 lg:space-y-6 lg:px-5">
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`fixed right-2.5 top-2.5 z-[120] flex max-w-[calc(100vw-20px)] items-center gap-2 rounded-xl px-3.5 py-2.5 text-[11px] font-semibold text-white shadow-[0_12px_30px_rgba(49,93,50,0.22)] sm:right-6 sm:top-6 sm:text-sm ${toastType === "success" ? "bg-[#315d32]" : "bg-[#b35a54]"
              }`}
            role={toastType === "success" ? "status" : "alert"}
          >
            {toastType === "success" ? (
              <CheckCircle2 size={15} className="shrink-0 text-[#b8df7d]" />
            ) : (
              <CircleAlert size={15} className="shrink-0" />
            )}
            {toast}
          </motion.div>
        )}

        {/* HERO */}
        <motion.section
          variants={itemVariants}
          className="group relative overflow-hidden rounded-[18px] bg-[#315d32] px-3 py-4 text-white shadow-[0_20px_60px_rgba(49,93,50,0.18)] sm:rounded-[28px] sm:px-6 sm:py-7 lg:px-8 lg:py-8"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.28, 0.18] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#b8df7d]/20 blur-2xl"
          />

          <motion.div
            animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-28 left-[28%] h-64 w-64 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
              <motion.div
                whileHover={{ scale: 1.08, rotate: 4 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 shadow-inner backdrop-blur sm:h-12 sm:w-12 sm:rounded-2xl"
              >
                <SettingsIcon className="h-4 w-4 sm:h-6 sm:w-6" />
              </motion.div>

              <div className="min-w-0">
                <div className="mb-1 flex items-center gap-1.5 sm:mb-1.5 sm:gap-2">
                  <motion.span
                    animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                    className="h-1.5 w-1.5 rounded-full bg-[#b8df7d] sm:h-2 sm:w-2"
                  />

                  <span className="text-[7px] font-bold uppercase tracking-[0.18em] text-white/60 sm:text-[10px]">
                    Admin control
                  </span>
                </div>

                <h1 className="text-[20px] font-black tracking-tight sm:text-3xl lg:text-[34px]">
                  Settings
                </h1>

                <p className="mt-1 max-w-xl text-[9px] leading-4 text-white/70 sm:mt-1.5 sm:text-sm sm:leading-5">
                  Manage your account, store configuration and application
                  preferences from one beautiful workspace.
                </p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={saveSettings}
              className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-[9px] font-bold text-[#315d32] shadow-lg transition-all sm:min-h-10 sm:w-auto sm:text-xs"
            >
              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Save Changes
            </motion.button>
          </div>
        </motion.section>

        {/* SECTION NAV */}
        <motion.nav
          variants={itemVariants}
          aria-label="Settings sections"
          className="flex gap-2 overflow-x-auto rounded-2xl border border-[#dceacb] bg-white p-2 shadow-[0_8px_30px_rgba(49,93,50,0.06)]"
        >
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollToSection(id)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#f7f8f2] px-4 py-2.5 text-[11px] font-bold text-[#315d32] transition hover:bg-[#315d32] hover:text-white sm:text-xs"
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </motion.nav>

        {/* CONTENT */}
        <motion.div
          variants={pageVariants}
          className="min-w-0 space-y-3 sm:space-y-5 lg:space-y-6"
        >
          {/* PROFILE + STORE SIDE BY SIDE */}
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-3 sm:gap-5 lg:grid-cols-2 lg:gap-6">
            {/* PROFILE */}
            <SettingsCard
              id="section-profile"
              icon={User}
              title="Admin Profile"
              description="Manage administrator account details"
            >
              <div className="mb-5 flex min-w-0 items-center gap-3 rounded-xl border border-[#dceacb] bg-[#eef5e7]/60 p-3 sm:p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#315d32] text-sm font-black text-white shadow-[0_8px_20px_rgba(49,93,50,0.2)] sm:h-14 sm:w-14">
                  {initials || "AD"}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#202a20] sm:text-base">
                    {profile.name || "Admin User"}
                  </p>

                  <p className="mt-0.5 truncate text-[10px] text-[#92998e] sm:text-xs">
                    {profile.email}
                  </p>

                  <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[8px] font-black text-[#315d32] sm:text-[9px]">
                    <ShieldCheck size={10} />
                    Administrator
                  </span>
                </div>
              </div>

              <SubHeading>Personal details</SubHeading>

              <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:gap-4">
                <Field label="Full Name">
                  <Input
                    icon={User}
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                  />
                </Field>

                <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                  <Field label="Email Address">
                    <Input
                      type="email"
                      icon={Mail}
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Phone Number">
                    <Input
                      icon={Phone}
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="mt-6">
                <SubHeading>Account overview</SubHeading>
                <div className="grid min-w-0 grid-cols-2 gap-3">
                  {[
                    ["Role", "Administrator"],
                    ["Status", "Active"],
                    ["Language", preferences.language],
                    ["Timezone", preferences.timezone],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="min-w-0 rounded-xl border border-[#dceacb] bg-[#f7f8f2] px-3 py-2.5"
                    >
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#92998e]">
                        {k}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-black text-[#202a20] sm:text-sm">
                        {v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </SettingsCard>

            {/* STORE */}
            <SettingsCard
              id="section-store"
              icon={Store}
              title="Store Settings"
              description="Configure your store and delivery operations"
            >
              <div className="space-y-6">
                <div>
                  <SubHeading>Store information</SubHeading>
                  <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                    <Field label="Store Name">
                      <Input
                        icon={Store}
                        value={store.name}
                        onChange={(e) =>
                          setStore({ ...store, name: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Store Address">
                      <Input
                        icon={MapPin}
                        value={store.address}
                        onChange={(e) =>
                          setStore({ ...store, address: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>

                <div>
                  <SubHeading>Contact</SubHeading>
                  <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                    <Field label="Store Email">
                      <Input
                        type="email"
                        icon={Mail}
                        value={store.email}
                        onChange={(e) =>
                          setStore({ ...store, email: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Store Phone">
                      <Input
                        icon={Phone}
                        value={store.phone}
                        onChange={(e) =>
                          setStore({ ...store, phone: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>

                <div>
                  <SubHeading>Operations</SubHeading>
                  <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                    <Field label="Delivery Radius (KM)">
                      <Input
                        type="number"
                        icon={Truck}
                        value={store.radius}
                        onChange={(e) =>
                          setStore({ ...store, radius: e.target.value })
                        }
                      />
                    </Field>

                    <Field label="Commission (%)">
                      <Input
                        type="number"
                        value={store.commission}
                        onChange={(e) =>
                          setStore({ ...store, commission: e.target.value })
                        }
                        suffix={
                          <span className="ml-1 shrink-0 rounded-md bg-[#eef5e7] px-1.5 py-0.5 text-[10px] font-black text-[#315d32]">
                            %
                          </span>
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </SettingsCard>

          </div>

          {/* SECURITY — BOLD VERSION */}
          <motion.section
            id="section-security"
            variants={itemVariants}
            className="relative min-w-0 scroll-mt-24 overflow-hidden rounded-[18px] border-2 border-[#315d32] bg-white shadow-[0_20px_60px_rgba(49,93,50,0.18)] sm:rounded-[28px]"
          >
            {/* Bold header */}
            <div className="relative overflow-hidden bg-[#315d32] px-4 py-5 text-white sm:px-7 sm:py-7">
              <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-[#b8df7d]/20 blur-2xl" />

              <div className="relative flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#315d32] shadow-lg sm:h-16 sm:w-16">
                  <KeyRound className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>

                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] sm:text-[10px]">
                    <ShieldCheck size={11} />
                    Account security
                  </span>

                  <h2 className="mt-1.5 text-lg font-black tracking-tight sm:text-2xl">
                    Change Password
                  </h2>

                  <p className="mt-0.5 text-[11px] leading-4 text-white/75 sm:text-sm">
                    Keep your admin account safe. Use a strong password that
                    you don&apos;t use anywhere else.
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="grid min-w-0 grid-cols-1 gap-5 p-4 sm:p-7 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
              {/* FORM */}
              <div className="min-w-0 space-y-5">
                {/* Step 1 */}
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#315d32] text-xs font-black text-white">
                    1
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="mb-2 text-sm font-black text-[#202a20]">
                      Verify it&apos;s you
                    </p>
                    <Field label="Current Password">
                      <PasswordInput
                        value={security.currentPassword}
                        placeholder="Enter current password"
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            currentPassword: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>

                <div className="ml-3.5 h-px bg-[#edf1e9]" />

                {/* Step 2 */}
                <div className="flex min-w-0 gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#315d32] text-xs font-black text-white">
                    2
                  </span>
                  <div className="min-w-0 flex-1 space-y-3.5">
                    <p className="text-sm font-black text-[#202a20]">
                      Set a new password
                    </p>

                    <Field label="New Password">
                      <PasswordInput
                        value={security.newPassword}
                        placeholder="Enter new password"
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            newPassword: e.target.value,
                          })
                        }
                      />
                    </Field>

                    {/* Strength meter */}
                    {strength && (
                      <div>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4].map((n) => (
                            <span
                              key={n}
                              className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                              style={{
                                backgroundColor:
                                  n <= passedRules
                                    ? strength.color
                                    : "#e6ebe1",
                              }}
                            />
                          ))}
                        </div>
                        <p
                          className="mt-1.5 text-[11px] font-black"
                          style={{ color: strength.color }}
                        >
                          Password strength: {strength.label}
                        </p>
                      </div>
                    )}

                    <Field label="Confirm Password">
                      <PasswordInput
                        value={security.confirmPassword}
                        placeholder="Confirm new password"
                        onChange={(e) =>
                          setSecurity({
                            ...security,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </Field>

                    {hasConfirm && (
                      <p
                        className={`flex items-center gap-1.5 text-[11px] font-bold ${passwordsMatch
                            ? "text-[#315d32]"
                            : "text-[#b35a54]"
                          }`}
                      >
                        {passwordsMatch ? (
                          <CheckCircle2 size={13} />
                        ) : (
                          <CircleAlert size={13} />
                        )}
                        {passwordsMatch
                          ? "Passwords match"
                          : "Passwords do not match yet"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={updatePassword}
                  disabled={isChangingPassword}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#315d32] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(49,93,50,0.28)] transition hover:bg-[#274d29] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Lock size={16} />
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </motion.button>
              </div>

              {/* REQUIREMENTS PANEL */}
              <aside className="min-w-0 self-start rounded-2xl border border-[#dceacb] bg-[#eef5e7]/60 p-4 sm:p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#315d32]">
                  Password checklist
                </p>
                <p className="mt-1 text-[11px] text-[#667065]">
                  Your new password should include:
                </p>

                <ul className="mt-3 space-y-2.5">
                  {rules.map((rule) => (
                    <li
                      key={rule.label}
                      className={`flex items-center gap-2.5 text-xs font-bold transition-colors ${rule.ok ? "text-[#315d32]" : "text-[#92998e]"
                        }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${rule.ok
                            ? "bg-[#315d32] text-white"
                            : "bg-white text-[#b5bbb1] border border-[#dceacb]"
                          }`}
                      >
                        {rule.ok ? <Check size={12} /> : <X size={11} />}
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-white p-3 text-[11px] leading-4 text-[#667065]">
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-[#315d32]"
                  />
                  Never share your password with anyone, including staff.
                </div>
              </aside>
            </div>
          </motion.section>

          {/* SAVE BAR */}
          <motion.div
            variants={itemVariants}
            className="sticky bottom-2 z-20 flex flex-col gap-2.5 rounded-[16px] border border-[#dceacb] bg-white/95 p-3 shadow-[0_12px_40px_rgba(49,93,50,0.14)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:rounded-[22px] sm:p-4"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eef5e7] text-[#315d32]">
                <CheckCircle2 size={16} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black text-[#202a20] sm:text-sm">
                  Ready to save?
                </p>

                <p className="truncate text-[9px] text-[#92998e] sm:text-xs">
                  Review your changes, then save all settings at once.
                </p>
              </div>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={saveSettings}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#315d32] px-6 text-xs font-bold text-white shadow-[0_8px_20px_rgba(49,93,50,0.2)] transition hover:bg-[#274d29] sm:w-auto"
            >
              <Save size={15} />
              Save Changes
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}