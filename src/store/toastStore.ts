import { create } from "zustand";

export type ToastType = "info" | "success" | "warning" | "critical";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

const DURATION: Record<ToastType, number> = {
  info: 3000,
  success: 3000,
  warning: 3500,
  critical: 4500,
};

/**
 * Single entry point for every notification in the web portal — mirrors
 * lasg_pts_mobile/lib/core/widgets/app_snackbar.dart: one call site,
 * dropping down from the top of the screen instead of an inline banner
 * buried in page content.
 */
export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show(message, type = "info") {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().dismiss(id), DURATION[type]);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export const toast = {
  show: (message: string, type?: ToastType) => useToastStore.getState().show(message, type),
  info: (message: string) => useToastStore.getState().show(message, "info"),
  success: (message: string) => useToastStore.getState().show(message, "success"),
  warning: (message: string) => useToastStore.getState().show(message, "warning"),
  critical: (message: string) => useToastStore.getState().show(message, "critical"),
};
