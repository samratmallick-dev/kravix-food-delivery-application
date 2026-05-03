import { Settings } from "lucide-react";

const AdminSettings = () => (
  <div className="p-5 max-w-[1400px]">
    <div className="mb-5">
      <h1 className="text-lg font-bold text-gray-800">Settings</h1>
      <p className="text-xs text-gray-400 mt-0.5">Platform configuration</p>
    </div>
    <div className="bg-white rounded-xl border border-gray-100 py-20 text-center"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <Settings size={32} className="mx-auto text-gray-200 mb-3" />
      <p className="text-sm text-gray-400">Settings panel coming soon.</p>
    </div>
  </div>
);

export default AdminSettings;
