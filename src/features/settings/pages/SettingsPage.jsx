import { useEffect, useState } from "react";
import { Mail, Bell, MessageCircle, SlidersHorizontal, Palette, Sun, Moon } from "lucide-react";
import { getNotificationPreferences, updateNotificationPreference } from "@/services/api/notificationApi";
import { useThemeStore } from "@/store/themeStore";

const CHANNELS = [
  { key: "email", label: "Email Notifications", icon: Mail },
  { key: "push", label: "Push Notifications", icon: Bell },
  { key: "whatsapp", label: "WhatsApp Notifications", icon: MessageCircle },
];

const THEME_OPTIONS = [
  { key: "light", label: "Light Mode", icon: Sun },
  { key: "dark", label: "Dark Mode", icon: Moon },
];

// Settings page — real notification-preference toggles (GET/PUT
// /trydood/v1/notifications/preferences) plus a local Appearance
// (light/dark) choice. There's no dark-mode styling anywhere else in the
// app yet, so the theme choice only live-previews on this page itself —
// see themeStore.js's comment.
export default function SettingsPage() {
  const [channels, setChannels] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingChannel, setSavingChannel] = useState(null);

  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    let cancelled = false;
    getNotificationPreferences()
      .then((res) => {
        if (cancelled) return;
        setChannels(res?.data?.channels ?? null);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load notification preferences.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleToggle = (channel) => {
    if (!channels || savingChannel) return;
    const next = !channels[channel]?.preference;
    setChannels((prev) => ({ ...prev, [channel]: { ...prev[channel], preference: next } }));
    setSavingChannel(channel);
    updateNotificationPreference(channel, next)
      .catch((err) => {
        // Revert the optimistic flip if the server rejected it.
        setChannels((prev) => ({ ...prev, [channel]: { ...prev[channel], preference: !next } }));
        setError(err.message || `Failed to update ${channel} notifications.`);
      })
      .finally(() => setSavingChannel(null));
  };

  const cardClass = isDark
    ? "bg-gray-800 border-gray-700"
    : "bg-white border-gray-100";
  const headingText = isDark ? "text-gray-100" : "text-gray-900";
  const subText = isDark ? "text-gray-400" : "text-gray-400";
  const borderClass = isDark ? "border-gray-700" : "border-gray-100";

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <div>
          <h1 className={`text-2xl font-bold ${headingText}`}>Settings</h1>
          <p className={`text-sm mt-1 ${subText}`}>Manage how Trydood contacts you and how this page looks.</p>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-600">{error}</p>
        )}

        {/* ── Preference → Notification ── */}
        <section className={`rounded-2xl border ${cardClass} p-5 sm:p-6`}>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${headingText}`}>Preference</h2>
              <p className={`text-xs mt-0.5 ${subText}`}>Notification — choose how you'd like to be notified.</p>
            </div>
          </div>

          <div className="mt-3">
            {loading ? (
              <p className={`text-sm py-6 text-center ${subText}`}>Loading preferences…</p>
            ) : !channels ? (
              <p className={`text-sm py-6 text-center ${subText}`}>Couldn't load notification preferences.</p>
            ) : (
              CHANNELS.map(({ key, label, icon: Icon }) => {
                const ch = channels[key];
                const checked = !!ch?.preference;
                return (
                  <div key={key} className={`flex items-center justify-between gap-4 py-4 border-b last:border-0 ${borderClass}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isDark ? "bg-gray-700 text-emerald-400" : "bg-emerald-50 text-emerald-500"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${headingText}`}>{label}</p>
                        {ch && !ch.effective && ch.blockedBy && (
                          <p className="text-xs text-amber-500 mt-0.5">
                            Currently disabled by {ch.blockedBy === "PLATFORM" ? "Trydood" : ch.blockedBy}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      aria-label={label}
                      disabled={savingChannel === key}
                      onClick={() => handleToggle(key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:ring-offset-1 disabled:opacity-50 ${
                        checked ? "bg-emerald-500" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                          checked ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ── Appearance ── */}
        <section className={`rounded-2xl border ${cardClass} p-5 sm:p-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${headingText}`}>Appearance</h2>
              <p className={`text-xs mt-0.5 ${subText}`}>Choose how the Vendor Panel looks.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {THEME_OPTIONS.map(({ key, label, icon: Icon }) => {
              const active = theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  className={`flex-1 flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                    active
                      ? "border-emerald-400 bg-emerald-50/10 ring-1 ring-emerald-400"
                      : isDark
                        ? "border-gray-700 hover:bg-gray-700/50"
                        : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-emerald-500 text-white" : isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`flex-1 text-sm font-semibold ${headingText}`}>{label}</span>
                  <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-emerald-500" : isDark ? "border-gray-600" : "border-gray-300"}`}>
                    {active && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                  </span>
                </button>
              );
            })}
          </div>

          <p className={`text-xs mt-3 ${subText}`}>
            Your choice is saved on this device. Right now it only previews here — the rest of the Vendor Panel
            doesn't support dark mode yet.
          </p>
        </section>
      </div>
    </div>
  );
}
