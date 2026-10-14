'use client';

import CloseIcon from '@mui/icons-material/Close';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import { ForgotPasswordForm } from './ForgotPasswordForm';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password';

export interface OpenAuthOptions {
  callbackUrl?: string;
  /** NextAuth error code from URL (OAuth flows, etc.). */
  error?: string;
  /** Context shown above the credentials form (e.g. scan requires sign-in). */
  promptMessage?: string;
  /** Prefill the sign-up website field (e.g. URL from the scan widget). */
  initialWebsite?: string;
}

interface AuthModalContextValue {
  openSignIn: (options?: OpenAuthOptions) => void;
  openSignUp: (options?: OpenAuthOptions) => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return ctx;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('auth.modal');
  const { status } = useSession();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [callbackUrl, setCallbackUrl] = useState<string | undefined>();
  const [routeError, setRouteError] = useState<string | undefined>();
  const [promptMessage, setPromptMessage] = useState<string | undefined>();
  const [initialWebsite, setInitialWebsite] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [signUpFormKey, setSignUpFormKey] = useState(0);

  const closeAuthModal = useCallback(() => {
    setOpen(false);
    setRouteError(undefined);
    setCallbackUrl(undefined);
    setPromptMessage(undefined);
    setInitialWebsite('');
    setForgotEmail('');
  }, []);

  const openSignIn = useCallback(
    (options?: OpenAuthOptions) => {
      if (status === 'authenticated') return;
      setMode('sign-in');
      setCallbackUrl(options?.callbackUrl);
      setRouteError(options?.error);
      setPromptMessage(options?.promptMessage);
      setInitialWebsite(options?.initialWebsite?.trim() ?? '');
      setSignUpFormKey((k) => k + 1);
      setOpen(true);
    },
    [status],
  );

  const openSignUp = useCallback(
    (options?: OpenAuthOptions) => {
      if (status === 'authenticated') return;
      setMode('sign-up');
      setCallbackUrl(options?.callbackUrl);
      setRouteError(undefined);
      setPromptMessage(options?.promptMessage);
      setInitialWebsite(options?.initialWebsite?.trim() ?? '');
      setSignUpFormKey((k) => k + 1);
      setOpen(true);
    },
    [status],
  );

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, value: string | number) => {
      setMode(value as AuthMode);
      setRouteError(undefined);
    },
    [],
  );

  const value = useMemo(
    () => ({ openSignIn, openSignUp, closeAuthModal }),
    [closeAuthModal, openSignIn, openSignUp],
  );

  const dialogTitleId = 'auth-modal-title';

  return (
    <AuthModalContext.Provider value={value}>
      {children}

      <Dialog
        open={open && status !== 'authenticated'}
        onClose={closeAuthModal}
        fullWidth
        maxWidth="sm"
        scroll="paper"
        aria-labelledby={dialogTitleId}
        slotProps={{
          paper: {
            sx: { borderRadius: 3, px: '0.5em' },
          },
        }}
      >
        <DialogTitle
          id={dialogTitleId}
          sx={{ p: 0, borderBottom: 1, borderColor: 'divider' }}
        >
          <Stack sx={{ flexDirection: 'row', alignItems: 'center', pr: 0.5 }}>
            {mode === 'forgot-password' ? (
              <Typography
                component="span"
                variant="h6"
                sx={{
                  flex: 1,
                  px: 2,
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '1rem',
                }}
              >
                {t('forgotPasswordTitle')}
              </Typography>
            ) : (
              <Tabs
                value={mode}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ flex: 1, minHeight: 48 }}
              >
                <Tab
                  label={t('tabSignIn')}
                  value="sign-in"
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                />
                <Tab
                  label={t('tabSignUp')}
                  value="sign-up"
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                />
              </Tabs>
            )}
            <IconButton
              aria-label={t('close')}
              onClick={closeAuthModal}
              edge="end"
              size="small"
              sx={{ mr: 0.5 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: 2, mt: '2em' }}>
          {mode === 'sign-in' ? (
            <SignInForm
              callbackUrl={callbackUrl}
              routeError={routeError}
              promptMessage={promptMessage}
              initialWebsite={initialWebsite}
              onForgotPassword={(email) => {
                setForgotEmail(email);
                setMode('forgot-password');
                setRouteError(undefined);
              }}
              onSwitchToSignUp={() => {
                setMode('sign-up');
                setRouteError(undefined);
              }}
            />
          ) : mode === 'sign-up' ? (
            <SignUpForm
              key={signUpFormKey}
              callbackUrl={callbackUrl}
              promptMessage={promptMessage}
              initialWebsite={initialWebsite}
              onSwitchToSignIn={() => {
                setMode('sign-in');
                setRouteError(undefined);
              }}
            />
          ) : (
            <ForgotPasswordForm
              initialEmail={forgotEmail}
              embedded
              onBackToSignIn={() => {
                setMode('sign-in');
                setRouteError(undefined);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}
