import { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { OnlineStatusProvider } from './context/OnlineStatusContext';
import theme from './theme';

import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import StaffList from './pages/Staff/StaffList';
import UsuariosList from './pages/Usuarios/UsuariosList';
import ConstructorList from './pages/Preguntas/ConstructorList';
import ConstructorFormularios from './pages/Formularios/ConstructorFormularios';
import ListadoFormularios from './pages/Formularios/ListadoFormularios';
import NuevaEncuesta from './pages/Encuestas/NuevaEncuesta';
import RegistrarEncuesta from './pages/Encuestas/RegistrarEncuesta';
import EncuestasRealizadas from './pages/Encuestas/EncuestasRealizadas';
import GrupoFamiliarPage from './pages/Grupos/GrupoFamiliarPage';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando auth...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.rol)) return <Navigate to="/" replace />;

  return children;
};

const ProtectedLayout = () => {
  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OnlineStatusProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/" element={<ProtectedLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="staff" element={
                  <ProtectedRoute allowedRoles={['administrador']}>
                    <StaffList />
                  </ProtectedRoute>
                } />
                <Route path="usuarios" element={<UsuariosList />} />
                <Route path="preguntas" element={<ConstructorList />} />
                <Route path="formularios" element={<ConstructorFormularios />} />
                <Route path="listado-formularios" element={<ListadoFormularios />} />
                <Route path="nueva-encuesta" element={<NuevaEncuesta />} />
                <Route path="registrar-encuesta" element={
                  <ProtectedRoute allowedRoles={['encuestador']}>
                    <RegistrarEncuesta />
                  </ProtectedRoute>
                } />
                <Route path="encuestas-realizadas" element={<EncuestasRealizadas />} />
                <Route path="grupos-familiares" element={<GrupoFamiliarPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </OnlineStatusProvider>
    </ThemeProvider>
  );
}

export default App;
