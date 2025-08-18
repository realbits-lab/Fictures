'use client';

import { Toaster } from '@/components/ui/toaster';
import { toast as sonnerToast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2, Upload, Download, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

// Enhanced toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'promise';

// Toast options interface
interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  dismissible?: boolean;
  icon?: React.ReactNode;
}

// Enhanced toast function
export function toast(message: string, type: ToastType = 'info', options: ToastOptions = {}) {
  const {
    title,
    description = message,
    duration = 4000,
    action,
    dismissible = true,
    icon
  } = options;

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'loading':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getToastClass = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 text-green-900';
      case 'error':
        return 'border-red-200 bg-red-50 text-red-900';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-900';
      case 'loading':
        return 'border-blue-200 bg-blue-50 text-blue-900';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-900';
    }
  };

  return sonnerToast(
    <div className={cn('flex items-start space-x-3', getToastClass())}>
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        {title && <div className="font-medium">{title}</div>}
        <div className={cn('text-sm', title && 'text-muted-foreground')}>{description}</div>
      </div>
    </div>,
    {
      duration: type === 'loading' ? Infinity : duration,
      dismissible: type === 'loading' ? false : dismissible,
      action: action ? {
        label: action.label,
        onClick: action.onClick
      } : undefined
    }
  );
}

// Specific toast variants
export const toastSuccess = (message: string, options?: Omit<ToastOptions, 'type'>) =>
  toast(message, 'success', options);

export const toastError = (message: string, options?: Omit<ToastOptions, 'type'>) =>
  toast(message, 'error', options);

export const toastWarning = (message: string, options?: Omit<ToastOptions, 'type'>) =>
  toast(message, 'warning', options);

export const toastInfo = (message: string, options?: Omit<ToastOptions, 'type'>) =>
  toast(message, 'info', options);

export const toastLoading = (message: string, options?: Omit<ToastOptions, 'type'>) =>
  toast(message, 'loading', { ...options, duration: Infinity, dismissible: false });

// Promise-based toast for async operations
export async function toastPromise<T>(
  promise: Promise<T>,
  {
    loading = 'Loading...',
    success = 'Success!',
    error = 'Something went wrong'
  }: {
    loading?: string;
    success?: string | ((data: T) => string);
    error?: string | ((error: any) => string);
  }
): Promise<T> {
  const toastId = toastLoading(loading);
  
  try {
    const result = await promise;
    sonnerToast.dismiss(toastId);
    
    const successMessage = typeof success === 'function' ? success(result) : success;
    toastSuccess(successMessage);
    
    return result;
  } catch (err) {
    sonnerToast.dismiss(toastId);
    
    const errorMessage = typeof error === 'function' ? error(err) : error;
    toastError(errorMessage);
    
    throw err;
  }
}

// Hierarchy-specific toast messages
export const hierarchyToasts = {
  // Book operations
  bookCreated: (title: string) => 
    toastSuccess(`Book "${title}" created successfully!`, {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    }),
  
  bookSaved: (title: string) => 
    toastSuccess(`"${title}" saved`, {
      icon: <Save className="h-5 w-5 text-green-500" />,
      duration: 2000
    }),
    
  bookDeleted: (title: string) => 
    toastInfo(`Book "${title}" deleted`, {
      duration: 3000
    }),

  // Chapter operations
  chapterCreated: (title: string) => 
    toastSuccess(`Chapter "${title}" created`),
    
  chapterGenerated: (title: string) => 
    toastSuccess(`Chapter "${title}" generated successfully!`, {
      duration: 5000,
      action: {
        label: 'View',
        onClick: () => {} // Will be filled by the calling component
      }
    }),
    
  chapterSaved: () => 
    toastSuccess('Chapter saved', { 
      duration: 1500,
      icon: <Save className="h-5 w-5 text-green-500" />
    }),

  // Scene operations
  sceneCreated: (title: string) => 
    toastSuccess(`Scene "${title}" created`),
    
  sceneGenerated: (title: string) => 
    toastSuccess(`Scene "${title}" generated`, {
      duration: 3000
    }),

  // AI operations
  aiContextUpdated: () => 
    toastInfo('AI context updated', { duration: 2000 }),
    
  aiGenerationStarted: () => 
    toastLoading('Generating content with AI...'),
    
  aiGenerationCompleted: () => 
    toastSuccess('AI generation completed!'),

  // Import/Export operations
  bookExported: (format: string) => 
    toastSuccess(`Book exported as ${format}`, {
      icon: <Download className="h-5 w-5 text-green-500" />,
      duration: 3000
    }),
    
  bookImported: (title: string) => 
    toastSuccess(`"${title}" imported successfully`, {
      icon: <Upload className="h-5 w-5 text-green-500" />,
      duration: 4000
    }),

  // Error states
  saveError: () => 
    toastError('Failed to save changes', {
      action: {
        label: 'Retry',
        onClick: () => {} // Will be filled by the calling component
      }
    }),
    
  loadError: () => 
    toastError('Failed to load content', {
      action: {
        label: 'Refresh',
        onClick: () => window.location.reload()
      }
    }),
    
  networkError: () => 
    toastError('Network connection error', {
      description: 'Please check your internet connection and try again.',
      action: {
        label: 'Retry',
        onClick: () => {} // Will be filled by the calling component
      }
    }),

  // Validation errors
  validationError: (field: string) => 
    toastWarning(`Please check the ${field} field`, {
      duration: 3000
    }),
    
  permissionError: () => 
    toastError('You don\'t have permission to perform this action'),

  // Progress operations
  bulkOperation: (completed: number, total: number) => 
    toastInfo(`Processing: ${completed}/${total} completed`, {
      duration: 1000
    }),
};

// Auto-save toast
export function showAutoSaveToast(success: boolean = true) {
  if (success) {
    toastSuccess('Auto-saved', {
      duration: 1000,
      icon: <Save className="h-4 w-4 text-green-500" />
    });
  } else {
    toastWarning('Auto-save failed', {
      duration: 2000,
      action: {
        label: 'Save manually',
        onClick: () => {} // Will be filled by the calling component
      }
    });
  }
}

// Batch operation toasts
export function createBatchToast(operations: Array<{ name: string; promise: Promise<any> }>) {
  const toastId = toastLoading(`Processing ${operations.length} operations...`);
  
  Promise.allSettled(operations.map(op => op.promise))
    .then(results => {
      sonnerToast.dismiss(toastId);
      
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
      if (failed === 0) {
        toastSuccess(`All ${successful} operations completed successfully!`);
      } else if (successful === 0) {
        toastError(`All ${failed} operations failed`);
      } else {
        toastWarning(`${successful} succeeded, ${failed} failed`, {
          duration: 5000
        });
      }
    });
}

// Enhanced Toaster component with better positioning and styling
export function EnhancedToaster() {
  return (
    <>
      <Toaster />
      <div id="sonner-toaster" />
    </>
  );
}

// Toast notification hook for components
export function useToast() {
  return {
    toast,
    success: toastSuccess,
    error: toastError,
    warning: toastWarning,
    info: toastInfo,
    loading: toastLoading,
    promise: toastPromise,
    hierarchy: hierarchyToasts,
    autoSave: showAutoSaveToast,
    batch: createBatchToast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId)
  };
}