import LinearProgress from '@mui/material/LinearProgress';

export default function LocaleLoading() {
  return (
    <LinearProgress
      sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}
    />
  );
}
