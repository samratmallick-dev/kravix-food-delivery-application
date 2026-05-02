import { useState, useEffect, type FormEvent } from "react";
import { X, Loader2 } from "lucide-react";

export interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "select" | "textarea" | "toggle";
  options?: string[];
  min?: number;
}

interface EditModalProps {
  title: string;
  fields: FieldConfig[];
  initialValues: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

const EditModal = ({ title, fields, initialValues, onSave, onClose }: EditModalProps) => {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, unknown> = {};
    fields.forEach((f) => { init[f.key] = initialValues[f.key] ?? ""; });
    setValues(init);
  }, [fields, initialValues]);

  const set = (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    fields.forEach((f) => {
      const v = values[f.key];
      if (f.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v))) {
        errs[f.key] = "Invalid email format";
      }
      if (f.type === "number" && v !== "" && (isNaN(Number(v)) || Number(v) < (f.min ?? 0))) {
        errs[f.key] = `Must be a number${f.min !== undefined ? ` ≥ ${f.min}` : ""}`;
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  value={String(values[f.key] ?? "")}
                  onChange={(e) => set(f.key, e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              ) : f.type === "select" ? (
                <select
                  value={String(values[f.key] ?? "")}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  {f.options?.map((o) => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                </select>
              ) : f.type === "toggle" ? (
                <button
                  type="button"
                  onClick={() => set(f.key, !values[f.key])}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${values[f.key] ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${values[f.key] ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              ) : (
                <input
                  type={f.type ?? "text"}
                  value={String(values[f.key] ?? "")}
                  onChange={(e) => set(f.key, e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 ${errors[f.key] ? "border-red-400" : "border-border"}`}
                />
              )}
              {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
            </div>
          ))}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold transition disabled:opacity-60 cursor-pointer hover:opacity-90 flex items-center justify-center gap-2">
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditModal;
