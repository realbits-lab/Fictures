"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthModalContextType {
  isOpen: boolean;
  openModal: (redirectTo?: string, action?: () => void) => void;
  closeModal: () => void;
  requireAuth: (action: () => void, redirectTo?: string) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

interface AuthModalProviderProps {
  children: React.ReactNode;
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle post-login actions
  React.useEffect(() => {
    if (status === 'authenticated' && session && (pendingAction || redirectTo)) {
      // Close modal first
      setIsOpen(false);
      
      // Execute pending action if exists
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
      
      // Navigate to redirect URL if exists
      if (redirectTo) {
        router.push(redirectTo);
        setRedirectTo(null);
      }
    }
  }, [session, status, pendingAction, redirectTo, router]);

  const openModal = useCallback((redirectTo?: string, action?: () => void) => {
    if (redirectTo) setRedirectTo(redirectTo);
    if (action) setPendingAction(() => action);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
    setRedirectTo(null);
  }, []);

  const requireAuth = useCallback((action: () => void, redirectTo?: string) => {
    if (session) {
      // User is already authenticated, execute action immediately
      action();
    } else {
      // User is not authenticated, show login modal
      openModal(redirectTo, action);
    }
  }, [session, openModal]);

  return (
    <AuthModalContext.Provider value={{
      isOpen,
      openModal,
      closeModal,
      requireAuth,
    }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
}