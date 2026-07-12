import { memo, useRef } from "react";
import { ImagePlus, ShieldCheck, Star } from "lucide-react";
import type { IRider, User } from "@/types";

interface ProfileHeaderProps {
  user: User;
  profile: IRider;
  editMode: boolean;
  previewUrl?: string | null;
  onImageChange: (file: File) => void;
}

const ProfileHeader = memo(({ user, profile, editMode, previewUrl, onImageChange }: ProfileHeaderProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-(--shadow-sm) p-5">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-gray-100">
            <img src={previewUrl ?? profile.picture} alt={user.name} className="w-full h-full object-cover object-top" />
          </div>
          {editMode && (
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Change photo"
              className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1.5 shadow-md"
            >
              <ImagePlus size={13} />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageChange(f); }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-800 truncate">{user.name}</h2>
            {profile.isVerified && <ShieldCheck size={15} className="text-green-500 shrink-0" aria-label="Verified" />}
          </div>
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${profile.isVerified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {profile.isVerified ? "Verified" : "Pending"}
            </span>
            {profile.rating !== null && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Star size={11} className="fill-yellow-400 text-yellow-400" />
                {profile.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ProfileHeader.displayName = "ProfileHeader";
export default ProfileHeader;
