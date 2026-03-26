/**
 * components/OnlineStatusBadge.jsx
 * Indicador de conectividad siempre visible en el AppBar.
 *
 * Muestra:
 *  🟢 Online           → verde    (operando contra MongoDB)
 *  🔴 Offline          → rojo     (operando en SQLite local)
 *  🔄 Sincronizando... → animado  (subiendo datos pendientes)
 *
 * Con click en el chip → fuerza sincronización manual
 */

import { useOnlineStatus } from '../context/OnlineStatusContext';
import {
  Chip,
  Tooltip,
  CircularProgress,
  Badge,
  Box,
  Typography,
  keyframes,
} from '@mui/material';
import CloudDoneIcon   from '@mui/icons-material/CloudDone';
import CloudOffIcon    from '@mui/icons-material/CloudOff';
import SyncIcon        from '@mui/icons-material/Sync';
import WifiOffIcon     from '@mui/icons-material/WifiOff';

const pulse = keyframes`
  0%   { opacity: 1; }
  50%  { opacity: 0.4; }
  100% { opacity: 1; }
`;

export default function OnlineStatusBadge() {
  const { isOnline, pendingSync, pendingCount, isSyncing, syncMessage, triggerSync } = useOnlineStatus();

  // ── Determinar apariencia ──────────────────────────────────────────────────
  let color, label, icon, tooltipText;

  if (isSyncing) {
    color = 'warning';
    label = 'Sincronizando...';
    icon = <CircularProgress size={12} color="inherit" />;
    tooltipText = `Subiendo ${pendingCount} registros pendientes a la nube`;
  } else if (!isOnline) {
    color = 'error';
    label = 'Offline';
    icon = <CloudOffIcon sx={{ fontSize: 14 }} />;
    tooltipText = pendingCount > 0
      ? `Sin conexión · ${pendingCount} registros pendientes de sincronizar`
      : 'Sin conexión a internet · Datos guardados localmente';
  } else if (pendingSync) {
    color = 'warning';
    label = `Online (${pendingCount} pendientes)`;
    icon = <SyncIcon sx={{ fontSize: 14 }} />;
    tooltipText = `Conectado · ${pendingCount} registros aún no sincronizados. Haz clic para sincronizar.`;
  } else {
    color = 'success';
    label = 'Online';
    icon = <CloudDoneIcon sx={{ fontSize: 14 }} />;
    tooltipText = 'Conectado y sincronizado con la nube';
  }

  return (
    <Tooltip title={tooltipText} arrow placement="bottom">
      <Box
        onClick={isOnline && pendingSync && !isSyncing ? triggerSync : undefined}
        sx={{ cursor: isOnline && pendingSync && !isSyncing ? 'pointer' : 'default' }}
      >
        <Badge
          badgeContent={pendingCount > 0 && !isSyncing ? pendingCount : 0}
          color="error"
          max={99}
          sx={{ '& .MuiBadge-badge': { fontSize: 10, minWidth: 16, height: 16 } }}
        >
          <Chip
            size="small"
            icon={icon}
            label={label}
            color={color}
            variant="filled"
            sx={{
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 24,
              animation: (!isOnline || isSyncing) ? `${pulse} 2s ease-in-out infinite` : 'none',
              '& .MuiChip-icon': { ml: '4px' },
              transition: 'all 0.3s ease',
            }}
          />
        </Badge>
      </Box>
    </Tooltip>
  );
}
