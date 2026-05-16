import { showToast } from '../components/Toast'

export function useToast() {
  const toast = {
    success: (message, duration = 3000) => showToast(message, 'success', duration),
    error: (message, duration = 3000) => showToast(message, 'error', duration),
    warning: (message, duration = 3000) => showToast(message, 'warning', duration),
    info: (message, duration = 3000) => showToast(message, 'info', duration)
  }
  return toast
}