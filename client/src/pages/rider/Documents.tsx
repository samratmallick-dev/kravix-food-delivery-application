import { useEffect } from "react";
import { useRiderProfile } from "../../hooks/useRiderProfile";
import DocumentCard from "../../components/rider/profile/DocumentCard";
import { ProfileSkeleton } from "../../components/skeleton/RiderSkeletons";
import { Info } from "lucide-react";

const Documents = () => {
  const { profile, loading, fetchProfile } = useRiderProfile();

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) return <ProfileSkeleton />;
  if (!profile) return <p className="text-center text-gray-500 py-12">Profile not found</p>;

  return (
    <div className="space-y-4 rider-page-enter">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
        <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Keep your documents up to date. Expired or missing documents may affect your ability to receive orders.
        </p>
      </div>

      <DocumentCard profile={profile} />
    </div>
  );
};

export default Documents;
