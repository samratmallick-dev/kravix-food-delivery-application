import { useEffect, useState } from "react";
import { useAppData } from "../../context/AppContext";
import { useRiderProfile } from "../../hooks/useRiderProfile";
import ProfileHeader from "../../components/rider/profile/ProfileHeader";
import SectionCard from "../../components/ui/SectionCard";
import { ProfileSkeleton } from "../../components/skeleton/RiderSkeletons";
import { Phone, CreditCard, FileText, Pencil, X, Loader2, Bike } from "lucide-react";

const Profile = () => {
  const { user } = useAppData();
  const { profile, loading, saving, fetchProfile, saveProfile } = useRiderProfile();
  const [editMode, setEditMode] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editAadhaar, setEditAadhaar] = useState("");
  const [editLicense, setEditLicense] = useState("");
  const [editPan, setEditPan] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const startEdit = () => {
    if (!profile) return;
    setEditPhone(profile.phoneNumber);
    setEditAadhaar(profile.aadhaarNumber);
    setEditLicense(profile.drivingLicesce);
    setEditPan(profile.panNumber ?? "");
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditPhone(""); setEditAadhaar(""); setEditLicense(""); setEditPan("");
    setEditImageFile(null); setEditImagePreview(null);
  };

  const handleSave = async () => {
    const payload: any = {};
    if (editPhone)     payload.phoneNumber    = editPhone;
    if (editAadhaar)   payload.aadhaarNumber  = editAadhaar;
    if (editLicense)   payload.drivingLicesce = editLicense;
    if (editPan)       payload.panNumber      = editPan.toUpperCase();
    if (editImageFile) payload.image          = editImageFile;
    const ok = await saveProfile(payload);
    if (ok) cancelEdit();
  };

  if (loading) return <ProfileSkeleton />;
  if (!profile || !user) return <p className="text-center text-gray-500 py-12">Profile not found</p>;

  return (
    <div className="space-y-4 rider-page-enter">
      <ProfileHeader
        user={user}
        profile={profile}
        editMode={editMode}
        previewUrl={editImagePreview}
        onImageChange={(f) => { setEditImageFile(f); setEditImagePreview(URL.createObjectURL(f)); }}
      />

      <div className="flex justify-end">
        <button
          onClick={editMode ? cancelEdit : startEdit}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-primary hover:text-primary transition"
        >
          {editMode ? <><X size={13} /> Cancel</> : <><Pencil size={13} /> Edit Profile</>}
        </button>
      </div>

      <SectionCard title="Personal Information">
        <div className="space-y-3">
          {editMode ? (
            <>
              {[
                { label: "Phone Number",    value: editPhone,   onChange: setEditPhone,   icon: <Phone size={14} />,      placeholder: "+91-9999999999" },
                { label: "Aadhaar Number",  value: editAadhaar, onChange: setEditAadhaar, icon: <CreditCard size={14} />, placeholder: "XXXX-XXXX-XXXX" },
                { label: "Driving License", value: editLicense, onChange: setEditLicense, icon: <FileText size={14} />,   placeholder: "WB-0420110012345" },
                { label: "PAN Number",      value: editPan,     onChange: setEditPan,     icon: <CreditCard size={14} />, placeholder: "ABCDE1234F" },
              ].map(({ label, value, onChange, icon, placeholder }) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">{label}</label>
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 focus-within:border-primary transition-colors">
                    <span className="text-gray-400 shrink-0">{icon}</span>
                    <input
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder={placeholder}
                      className="flex-1 outline-none text-sm text-gray-700 bg-transparent uppercase"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              {[
                { icon: <Phone size={16} />,      label: "Phone Number",       value: profile.phoneNumber },
                { icon: <CreditCard size={16} />, label: "Aadhaar Number",     value: `XXXX-XXXX-${profile.aadhaarNumber.slice(-4)}` },
                { icon: <FileText size={16} />,   label: "Driving License",    value: profile.drivingLicesce },
                ...(profile.panNumber ? [{ icon: <CreditCard size={16} />, label: "PAN Number", value: profile.panNumber.toUpperCase() }] : []),
                { icon: <Bike size={16} />,       label: "Verification Status", value: profile.isVerified ? "Verified ✓" : "Pending Verification" },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-primary shrink-0">{icon}</span>
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className={`text-sm font-medium ${label === "Verification Status" ? (profile.isVerified ? "text-green-600" : "text-amber-600") : "text-gray-700"}`}>
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
};

export default Profile;
