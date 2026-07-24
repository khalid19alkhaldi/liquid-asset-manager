import { AdminView } from "../dashboards/AdminView";
import { FacilityManagerView } from "../dashboards/FacilityManagerView";

export function EmployeePortal({ profile, role }: { profile: any; role: string }) {
  if (role === 'admin') return <AdminView />;
  return <FacilityManagerView profile={profile} />;
}
