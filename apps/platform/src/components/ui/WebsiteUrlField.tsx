'use client';

import type { ReactNode, Ref } from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { authFieldSx } from '@/components/auth/authFieldSx';
import { stripWebsiteUrlPrefix } from '@/lib/account/websiteUrlField';

export type WebsiteUrlFieldProps = {
  label: string;
  value: string;
  onChange: (host: string) => void;
  error?: boolean;
  helperText?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  autoComplete?: string;
  id?: string;
  inputRef?: Ref<HTMLInputElement>;
};

/**
 * Website URL with a fixed `https://` prefix cell and a host-only editable field.
 * Full URL validation runs via `parseWebsiteUrl` in the parent form.
 */
export function WebsiteUrlField({
  label,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  disabled = false,
  placeholder,
  name = 'website',
  autoComplete = 'url',
  id,
  inputRef,
}: WebsiteUrlFieldProps) {
  const theme = useTheme();
  const fieldDir = theme.direction === 'rtl' ? 'rtl' : 'ltr';
  const host = stripWebsiteUrlPrefix(value);
  const labelId = id ? `${id}-label` : 'website-url-label';
  const helperId = id ? `${id}-helper` : 'website-url-helper';

  return (
    <FormControl
      fullWidth
      required={required}
      error={error}
      disabled={disabled}
      sx={authFieldSx}
    >
      <InputLabel htmlFor={id ?? name} id={labelId} shrink>
        {label}
      </InputLabel>
      <Box
        dir="ltr"
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          mt: 2.25,
        }}
      >
        <Box
          aria-hidden
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.75,
            border: 1,
            borderColor: error ? 'error.main' : 'divider',
            borderInlineEnd: 0,
            borderStartStartRadius: 8,
            borderEndStartRadius: 8,
            bgcolor: 'action.hover',
            color: 'text.secondary',
          }}
        >
          <Typography component="span" variant="body1" sx={{ fontWeight: 400 }}>
            https://
          </Typography>
        </Box>
        <OutlinedInput
          id={id ?? name}
          name={name}
          type="text"
          inputRef={inputRef}
          value={host}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange(stripWebsiteUrlPrefix(e.target.value))}
          notched={false}
          label={undefined}
          sx={{
            flex: 1,
            borderStartStartRadius: 0,
            borderEndStartRadius: 0,
            borderStartEndRadius: 8,
            borderEndEndRadius: 8,
            '& fieldset': {
              borderStartStartRadius: 0,
              borderEndStartRadius: 0,
            },
          }}
          slotProps={{
            input: {
              dir: fieldDir,
              maxLength: 2040,
              inputMode: 'url',
              'aria-labelledby': labelId,
              'aria-describedby': helperText ? helperId : undefined,
            },
          }}
        />
      </Box>
      {helperText ? (
        <FormHelperText id={helperId}>{helperText}</FormHelperText>
      ) : null}
    </FormControl>
  );
}
