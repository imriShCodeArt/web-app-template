/** Shared TextField styling for auth forms (sign-in / sign-up / modal). */
export const authFieldSx = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'background.paper',
  },
  '& .MuiOutlinedInput-input': {
    color: 'text.primary',
  },
  '& .MuiInputLabel-root': {
    color: 'text.secondary',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'text.primary',
  },
  '& input:-webkit-autofill': {
    WebkitBoxShadow: '0 0 0 1000px var(--mui-palette-background-paper) inset',
    WebkitTextFillColor: 'var(--mui-palette-text-primary)',
    transition: 'background-color 9999s ease-out 0s',
  },
} as const;
