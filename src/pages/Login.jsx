import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import PublicIcon from '@mui/icons-material/Public';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import HomeRepairServiceIcon from '@mui/icons-material/HomeRepairService';
import SettingsIcon from '@mui/icons-material/Settings'; // Reemplazo de industria (tuerca)
import MedicationIcon from '@mui/icons-material/Medication'; // Medicina
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'; // Salud
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Educación (libros)

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(usuario, password);
      navigate('/');
    } catch (err) {
      setError('Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  // Red densa y simétrica con Salud, Educación y Medicina
  const watermarks = [
    // Fila 1
    { icon: <PublicIcon />, size: 40, top: '5%', left: '8%', rotate: '0deg', opacity: 0.15 },
    { icon: <FamilyRestroomIcon />, size: 60, top: '5%', left: '30%', rotate: '0deg', opacity: 0.15 },
    { icon: <MenuBookIcon />, size: 60, top: '5%', left: '50%', rotate: '0deg', opacity: 0.15 },
    { icon: <Diversity3Icon />, size: 60, top: '5%', left: '72%', rotate: '0deg', opacity: 0.15 },
    { icon: <PublicIcon />, size: 40, top: '5%', left: '92%', rotate: '0deg', opacity: 0.15 },

    // Fila 2
    { icon: <SettingsIcon />, size: 55, top: '28%', left: '15%', rotate: '0deg', opacity: 0.15 },
    { icon: <MedicalServicesIcon />, size: 55, top: '28%', left: '40%', rotate: '0deg', opacity: 0.15 },
    { icon: <BarChartIcon />, size: 55, top: '28%', left: '62%', rotate: '0deg', opacity: 0.15 },
    { icon: <SettingsIcon />, size: 55, top: '28%', left: '88%', rotate: '0deg', opacity: 0.15 },

    // Fila 3
    { icon: <MedicationIcon />, size: 55, top: '52%', left: '10%', rotate: '0deg', opacity: 0.15 },
    { icon: <PeopleIcon />, size: 65, top: '52%', left: '32%', rotate: '0deg', opacity: 0.15 },
    { icon: <PeopleIcon />, size: 65, top: '52%', left: '50%', rotate: '0deg', opacity: 0.15 },
    { icon: <HomeRepairServiceIcon />, size: 55, top: '52%', left: '70%', rotate: '0deg', opacity: 0.15 },
    { icon: <MedicationIcon />, size: 55, top: '52%', left: '90%', rotate: '0deg', opacity: 0.15 },

    // Fila 4
    { icon: <TrendingUpIcon />, size: 60, top: '75%', left: '12%', rotate: '0deg', opacity: 0.15 },
    { icon: <MenuBookIcon />, size: 60, top: '75%', left: '38%', rotate: '0deg', opacity: 0.15 },
    { icon: <MedicalServicesIcon />, size: 60, top: '75%', left: '60%', rotate: '0deg', opacity: 0.15 },
    { icon: <TrendingUpIcon />, size: 60, top: '75%', left: '85%', rotate: '0deg', opacity: 0.15 },

    // Fila 5
    { icon: <TimelineIcon />, size: 65, top: '92%', left: '18%', rotate: '0deg', opacity: 0.15 },
    { icon: <FamilyRestroomIcon />, size: 70, top: '92%', left: '50%', rotate: '0deg', opacity: 0.15 },
    { icon: <TimelineIcon />, size: 65, top: '92%', left: '82%', rotate: '0deg', opacity: 0.15 },
  ];

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'url("/Users/skyrecordsinc/.gemini/antigravity/brain/993e48be-2f03-48ca-b48e-a784885f8a3f/login_bg_analytics_abstract_png_1774378634286.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(55, 71, 79, 0.7)', 
          zIndex: 1
        }
      }}
    >
      {/* Watermarks Layer */}
      {watermarks.map((wm, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            top: wm.top,
            left: wm.left,
            right: wm.right,
            bottom: wm.bottom,
            transform: `rotate(${wm.rotate || '0deg'})`,
            opacity: wm.opacity, // Higher opacity for more contrast
            color: 'white',
            zIndex: 1,
            pointerEvents: 'none',
            '& svg': { fontSize: wm.size }
          }}
        >
          {wm.icon}
        </Box>
      ))}

      {/* Login Card */}
      <Paper
        elevation={24}
        sx={{
          zIndex: 10,
          position: 'relative',
          width: '100%',
          maxWidth: 325,
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
        }}
      >
        <Box sx={{ p: 0 }}>
          {/* Brand Header */}
          <Box sx={{ 
            p: 3, 
            textAlign: 'center', 
            background: 'linear-gradient(135deg, #1565C0 0%, #1a237e 100%)',
            color: 'white'
          }}>
            <Box sx={{ 
              display: 'inline-flex', 
              p: 1.5, 
              borderRadius: 3, 
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              mb: 1.5
            }}>
              <AssessmentIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight="900" sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: '1.25rem' }}>
              SocialData
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', letterSpacing: 1 }}>
              GESTIÓN DE CARACTERIZACIÓN
            </Typography>
          </Box>

          <Box sx={{ p: 4, pt: 3.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: '#1a237e' }}>
              ¡Hola de nuevo!
            </Typography>
            <Typography variant="body2" sx={{ color: '#78909c', mb: 3 }}>
              Inicie sesión para acceder al panel.
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                label="Usuario"
                variant="outlined"
                fullWidth
                margin="dense"
                size="small"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonOutlineIcon sx={{ color: '#90a4ae', fontSize: 22 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fafafa',
                  }
                }}
              />

              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                margin="dense"
                size="small"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: '#fafafa',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: '#90a4ae', fontSize: 22 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="ver contraseña"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  mt: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 800,
                  textTransform: 'none',
                  backgroundColor: '#1565CC',
                  boxShadow: '0 10px 20px rgba(21, 101, 204, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: '#0d47a1',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 15px 25px rgba(21, 101, 204, 0.4)',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Entrar Ahora'}
              </Button>
            </form>
          </Box>
          <Box sx={{ textAlign: 'center', pb: 3 }}>
            <Typography variant="caption" sx={{ color: '#b0bec5' }}>
               PROYECTO SOCIALDATA &bull; {new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
