"use client";

import { AlertTriangle, CheckCircle2, Info, XCircle, X } from "lucide-react";
import { useToastStore, ToastType } from "@/store/toastStore";

const STYLES: Record<ToastType, { bg: string; fg: string; Icon: typeof Info }> = {
  info: { bg: "bg-brand-primary", fg: "text-white", Icon: Info },
  success: { bg: "bg-brand-primary", fg: "text-white", Icon: CheckCircle2 },
  warning: { bg: "bg-brand-primary", fg: "text-white", Icon: AlertTriangle },
  critical: { bg: "bg-brand-primary", fg: "text-white", Icon: XCircle },
};

const ACCENT: Record<ToastType, string> = {
  info: "#9ca3af",
  success: "#4ade80",
  warning: "#fcd34d",
  critical: "#fca5a5",
};

/**
 * Renders every active toast as a banner that drops down from the top
 * of the viewport — mounted once in the root layout so it works on
 * /login and every portal page alike. Mirrors the mobile app's
 * AppSnackBar v2 (see lasg_pts_mobile/lib/core/widgets/app_snackbar.dart).
 */
export function ToastHost() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4">
      {toasts.map((t) => {
        const { bg, fg, Icon } = STYLES[t.type];
        return (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`toast-drop-in flex w-full max-w-md cursor-pointer items-center gap-3 rounded-xl px-4 py-3 shadow-xl ${bg} ${fg}`}
          >
            <Icon size={18} style={{ color: ACCENT[t.type] }} />
            <span className="flex-1 text-sm">{t.message}</span>
            <X size={16} className="opacity-60" />
          </div>
        );
      })}
    </div>
  );
}
