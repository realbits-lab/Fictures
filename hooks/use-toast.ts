import { toast as sonnerToast } from 'sonner';

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export const toast = (props: ToastProps) => {
  const { title, description, variant = 'default', action, duration = 5000 } = props;
  
  const message = title || description || '';
  const descriptionText = title && description ? description : undefined;
  
  if (variant === 'destructive') {
    sonnerToast.error(message, {
      description: descriptionText,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    });
  } else {
    sonnerToast.success(message, {
      description: descriptionText,
      duration,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
    });
  }
};

export const useToast = () => {
  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
};