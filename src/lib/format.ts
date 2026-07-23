export function formatSAR(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  return v.toLocaleString("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 });
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: "قيد الانتظار",
    approved: "تم الاعتماد",
    in_progress: "جاري الصيانة",
    completed: "مكتمل",
    rejected: "مرفوض",
  };
  return map[s] ?? s;
}

export function priorityLabel(p: string): string {
  const map: Record<string, string> = {
    low: "منخفضة",
    medium: "متوسطة",
    high: "عالية",
    urgent: "طارئة",
  };
  return map[p] ?? p;
}

export function buildingTypeLabel(t: string): string {
  const map: Record<string, string> = {
    main_admin: "مبنى إداري رئيسي",
    school: "مدرسة",
    residential: "عمارة سكنية / أوقاف",
    warehouse: "مستودع",
    branch_office: "مكاتب إشرافية",
  };
  return map[t] ?? t;
}

export function roleLabel(r: string): string {
  const map: Record<string, string> = {
    admin: "مدير الصيانة العام",
    facility_manager: "مسؤول منشأة",
    technician: "فني صيانة",
  };
  return map[r] ?? r;
}
