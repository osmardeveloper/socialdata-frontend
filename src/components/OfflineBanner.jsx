/**
 * components/OfflineBanner.jsx
 * Banner flotante que aparece cuando el sistema está offline o sincronizando.
 * Se muestra debajo del AppBar, siempre visible.
 */

import { useOnlineStatus } from '../context/OnlineStatusContext';
import { Alert, Collapse, Button, Box } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SyncIcon    from '@mui/icons-material/Sync';

export default function OfflineBanner() {
  const { isOnline, syncMessage, isSyncing, pendingCount, triggerSync } = useOnlineStatus();

  // No mostrar nada si todo está bien y no hay mensaje
  const show = !isOnline || isSyncing || syncMessage;

  let severity = 'info';
  let message  = syncMessage;
  let icon     = null;

  if (!isOnline) {
    severity = 'warning';
    message  = `🔴 Trabajando en modo offline · Los datos se guardan localmente${pendingCount > 0 ? ` · ${pendingCount} pendientes de sync` : ''}`;
    icon     = <WifiOffIcon fontSize="small" />;
  } else if (isSyncing) {
    severity = 'info';
    message  = '🔄 Sincronizando datos con la nube...';
    icon     = <SyncIcon fontSize="small" sx={{ animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} />;
  } else if (syncMessage) {
    severity = syncMessage.startsWith('✅') ? 'success' : 'error';
    message  = syncMessage;
  }

  return (
    <Collapse in={!!show}>
      <Alert
        severity={severity}
        icon={icon}
        sx={{
          borderRadius: 0,
          py: 0.5,
          fontSize: '0.8rem',
          '& .MuiAlert-message': { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
        }}
        action={
          isOnline && pendingCount > 0 && !isSyncing ? (
            <Button
              color="inherit"
              size="small"
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={triggerSync}
              sx={{ fontSize: '0.7rem', py: 0.2 }}
            >
              Sincronizar ahora
            </Button>
          ) : null
        }
      >
        {message}
      </Alert>
    </Collapse>
  );
}
