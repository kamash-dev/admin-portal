import { useState } from "react";
import { Save, User, Bell, Shield } from "lucide-react";
import { useAuth } from "~/context/auth.context";

export default function Settings() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile Section */}
      <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-admin-border">
          <User size={18} className="text-admin-muted" />
          <h2 className="text-base font-bold text-slate-900">Profile</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                type="text"
                defaultValue={user?.name || ""}
                className="w-full px-3 py-2.5 border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                defaultValue={user?.email || ""}
                className="w-full px-3 py-2.5 border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <input
              type="text"
              defaultValue={user?.role || "Admin"}
              disabled
              className="w-full px-3 py-2.5 border border-admin-border rounded-lg text-sm bg-admin-bg text-admin-muted cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-admin-border">
          <Bell size={18} className="text-admin-muted" />
          <h2 className="text-base font-bold text-slate-900">Notifications</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Email notifications for new orders", defaultChecked: true },
            { label: "Push notifications for low stock alerts", defaultChecked: true },
            { label: "Weekly summary reports", defaultChecked: false },
            { label: "Marketing and promotional emails", defaultChecked: false },
          ].map((item) => (
            <label
              key={item.label}
              className="flex items-center justify-between cursor-pointer group"
            >
              <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                {item.label}
              </span>
              <input
                type="checkbox"
                defaultChecked={item.defaultChecked}
                className="w-4 h-4 rounded border-admin-border text-admin-primary focus:ring-admin-primary/20"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-xl border border-admin-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-admin-border">
          <Shield size={18} className="text-admin-muted" />
          <h2 className="text-base font-bold text-slate-900">Security</h2>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full px-3 py-2.5 border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                className="w-full px-3 py-2.5 border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full px-3 py-2.5 border border-admin-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-admin-primary/20 focus:border-admin-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 justify-end">
        {saved && (
          <span className="text-sm text-admin-success font-medium">
            Settings saved successfully
          </span>
        )}
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-admin-primary text-white rounded-lg text-sm font-semibold hover:bg-admin-primary-hover transition-colors"
        >
          <Save size={16} />
          Save Changes
        </button>
      </div>
    </div>
  );
}
