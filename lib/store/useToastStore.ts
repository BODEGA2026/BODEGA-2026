import { create } from "zustand";

export type ToastType = "success" | "error" | "info" | "warning";
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: ToastItem[];
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  toast: (message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().dismiss(id), 3200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

// Atajo global equivalente a toast(msg, type) en el sistema original
export const toast = (message: string, type: ToastType = "info") =>
  useToastStore.getState().toast(message, type);
