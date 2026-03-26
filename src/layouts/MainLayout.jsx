import { useState, useContext } from 'react';
import OnlineStatusBadge from '../components/OnlineStatusBadge';
import OfflineBanner from '../components/OfflineBanner';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/GroupAdd'; // Usuarios a caracterizar
import AssignmentIcon from '@mui/icons-material/Assignment';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import CreateIcon from '@mui/icons-material/Create';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NoteAddIcon from '@mui/icons-material/NoteAdd';      // Nueva Encuesta
import ListAltIcon from '@mui/icons-material/ListAlt';        // Listado Formularios
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';

export default function MainLayout() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { text: 'Inicio', icon: <DashboardIcon />, path: '/' },
    { text: 'Staff', icon: <PeopleIcon />, path: '/staff', roles: ['administrador'] },
    { text: 'Usuarios (Población)', icon: <GroupIcon />, path: '/usuarios' },
    { text: 'Constructor de Preguntas', icon: <AssignmentIcon />, path: '/preguntas', roles: ['administrador'] },
    { text: 'Constructor de Formulario', icon: <DocumentScannerIcon />, path: '/formularios', roles: ['administrador'] },
    { text: 'Listado de Formularios', icon: <ListAltIcon />, path: '/listado-formularios' },
    { text: 'Nueva Encuesta', icon: <NoteAddIcon />, path: '/nueva-encuesta' },
    { text: 'Grupos Familiares', icon: <FamilyRestroomIcon />, path: '/grupos-familiares' },
    { text: 'Encuestas Realizadas', icon: <AssessmentIcon />, path: '/encuestas-realizadas' },
  ];

  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation" onClick={() => setDrawerOpen(false)}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: 'primary.main', color: 'white' }}>
        <AccountCircleIcon fontSize="large" />
        <Box>
          <Typography variant="body1" fontWeight="bold">{user?.nombre}</Typography>
          <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{user?.rol}</Typography>
        </Box>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => {
          if (item.roles && !item.roles.includes(user?.rol)) return null;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 'bold' : 'normal', color: location.pathname === item.path ? 'primary.main' : 'text.primary' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ color: 'error.main' }}>
            <ListItemIcon sx={{ color: 'error.main' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Cerrar Sesión" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            SocialData
          </Typography>
          <Box display="flex" alignItems="center" gap={1} sx={{ mr: 2 }}>
            <AccountCircleIcon fontSize="small" sx={{ opacity: 0.85 }} />
            <Box>
              <Typography variant="body2" fontWeight="bold" lineHeight={1.2}>{user?.nombre}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.75, textTransform: 'capitalize' }}>{user?.rol}</Typography>
            </Box>
          </Box>
          <OnlineStatusBadge />
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />} sx={{ ml: 1 }}>Salir</Button>
        </Toolbar>
      </AppBar>
      <OfflineBanner />
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, backgroundColor: 'background.default', width: '100%', display: 'block' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
