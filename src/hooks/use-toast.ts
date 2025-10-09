import { toast as sonnerToast } from 'sonner';

type ToastOptions = {
  description?: string;
  variant?: 'default' | 'destructive';
};

const toast = (options: { title: string } & ToastOptions) => {
  if (options.variant === 'destructive') {
    sonnerToast.error(options.title, { description: options.description });
  } else {
    sonnerToast.success(options.title, { description: options.description });
  }
};

export const useToast = () => {
  return { toast };
};