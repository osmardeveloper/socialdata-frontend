import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Paper, TextField, MenuItem, Divider,
  Accordion, AccordionSummary, AccordionDetails, Switch, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, Checkbox, FormGroup, InputAdornment, CircularProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../../api/api';

const TIPOS_DOCUMENTO = [
  'Cédula de Ciudadanía',
  'Tarjeta de Identidad',
  'Cédula de Extranjería',
  'Pasaporte',
  'Permiso de Protección Temporal (PPT)',
  'Registro Civil'
];

const EMPTY_USER = {
  tipo_documento: '',
  numero_documento: '',
  nombre: '',
  apellido: '',
  direccion: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: ''
};

export default function NuevaEncuesta() {
  const [formularios, setFormularios] = useState([]);
  const [formSelect, setFormSelect] = useState('');
  const [preguntasActuales, setPreguntasActuales] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [userData, setUserData] = useState(EMPTY_USER);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    api.get('/formularios').then(({ data }) => setFormularios(data)).catch(console.error);
  }, []);

  // Buscar usuario por número de documento con debounce
  const handleDocumentoChange = (e) => {
    const val = e.target.value;
    setUserData(prev => ({ ...prev, numero_documento: val }));
    setUsuarioEncontrado(null);

    clearTimeout(debounceRef.current);
    if (val.length >= 4) {
      setBuscando(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await api.get(`/usuarios/buscar?numero_documento=${val}`);
          setUsuarioEncontrado(data);
          setUserData({
            tipo_documento: data.tipo_documento,
            numero_documento: data.numero_documento,
            nombre: data.nombre,
            apellido: data.apellido,
            direccion: data.direccion,
            telefono: data.telefono,
            correo: data.correo,
            fecha_nacimiento: data.fecha_nacimiento?.split('T')[0] || ''
          });
        } catch {
          setUsuarioEncontrado(null);
        }
        setBuscando(false);
      }, 600);
    } else {
      setBuscando(false);
    }
  };

  const handleFormSelect = (e) => {
    const formId = e.target.value;
    setFormSelect(formId);
    const form = formularios.find(f => f._id === formId);
    if (form) {
      const flat = form.preguntas.flatMap(b => b.detalles);
      setPreguntasActuales(flat);
      if (flat.length > 0) setExpanded(flat[0]._id);
      setRespuestas({});
    }
  };

  const handleRespChange = (pregId, valor, isMultiple = false, item = null) => {
    if (isMultiple) {
      const prev = Array.isArray(respuestas[pregId]) ? respuestas[pregId] : [];
      const next = valor ? [...prev, item] : prev.filter(v => v !== item);
      setRespuestas({ ...respuestas, [pregId]: next });
    } else {
      setRespuestas({ ...respuestas, [pregId]: valor });
    }
  };

  const nextQuestion = (idx) => {
    if (idx + 1 < preguntasActuales.length) setExpanded(preguntasActuales[idx + 1]._id);
    else setExpanded(false);
  };

  const handleGuardar = async () => {
    if (!userData.numero_documento || !userData.nombre) return alert('Completa los datos del usuario');
    if (!formSelect) return alert('Selecciona un formulario');

    try {
      let userId = usuarioEncontrado?._id;

      // Si no existe el usuario, lo creamos
      if (!userId) {
        const { data } = await api.post('/usuarios', userData);
        userId = data._id;
      }

      const respArray = Object.keys(respuestas).map(k => ({
        pregunta_id: k,
        respuesta: respuestas[k]
      }));

      await api.post('/encuestas', {
        formulario_id: formSelect,
        usuario_id: userId,
        respuestas: respArray
      });

      alert('¡Encuesta guardada exitosamente!');
      setUserData(EMPTY_USER);
      setUsuarioEncontrado(null);
      setFormSelect('');
      setPreguntasActuales([]);
      setRespuestas({});
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        Nueva Encuesta
      </Typography>

      <Paper sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        {/* ── SECCIÓN USUARIO ── */}
        <Typography variant="h6" color="secondary.main" fontWeight="bold" gutterBottom>
          1. Datos del Ciudadano
        </Typography>

        {/* Búsqueda por documento */}
        <TextField
          fullWidth
          label="Número de Documento (búsqueda automática)"
          value={userData.numero_documento}
          onChange={handleDocumentoChange}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
            endAdornment: buscando
              ? <InputAdornment position="end"><CircularProgress size={18} /></InputAdornment>
              : usuarioEncontrado
                ? <InputAdornment position="end"><CheckCircleIcon color="success" /></InputAdornment>
                : null
          }}
          helperText={usuarioEncontrado ? `✔ Usuario encontrado: ${usuarioEncontrado.nombre} ${usuarioEncontrado.apellido}` : 'Ingresa el número para buscar o diligenciar nuevos datos'}
        />

        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            select label="Tipo de Documento" value={userData.tipo_documento}
            onChange={e => setUserData({ ...userData, tipo_documento: e.target.value })}
            sx={{ flex: 1, minWidth: 220 }} disabled={!!usuarioEncontrado}
          >
            {TIPOS_DOCUMENTO.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Nombre" value={userData.nombre}
            onChange={e => setUserData({ ...userData, nombre: e.target.value })}
            sx={{ flex: 1, minWidth: 160 }} disabled={!!usuarioEncontrado} />
          <TextField label="Apellido" value={userData.apellido}
            onChange={e => setUserData({ ...userData, apellido: e.target.value })}
            sx={{ flex: 1, minWidth: 160 }} disabled={!!usuarioEncontrado} />
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap" mt={2}>
          <TextField label="Dirección" value={userData.direccion}
            onChange={e => setUserData({ ...userData, direccion: e.target.value })}
            sx={{ flex: 1 }} disabled={!!usuarioEncontrado} />
          <TextField label="Teléfono" value={userData.telefono}
            onChange={e => setUserData({ ...userData, telefono: e.target.value })}
            sx={{ flex: 1 }} disabled={!!usuarioEncontrado} />
          <TextField label="Correo" type="email" value={userData.correo}
            onChange={e => setUserData({ ...userData, correo: e.target.value })}
            sx={{ flex: 1 }} disabled={!!usuarioEncontrado} />
          <TextField label="Fecha de Nacimiento" type="date" InputLabelProps={{ shrink: true }}
            value={userData.fecha_nacimiento}
            onChange={e => setUserData({ ...userData, fecha_nacimiento: e.target.value })}
            sx={{ flex: 1 }} disabled={!!usuarioEncontrado} />
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* ── SECCIÓN FORMULARIO ── */}
        <Typography variant="h6" color="secondary.main" fontWeight="bold" gutterBottom>
          2. Seleccionar Formulario
        </Typography>
        <TextField select fullWidth label="Formulario de Caracterización" value={formSelect} onChange={handleFormSelect} sx={{ mb: 3 }}>
          {formularios.map(f => <MenuItem key={f._id} value={f._id}>{f.titulo}</MenuItem>)}
        </TextField>

        {/* ── PREGUNTAS ── */}
        {preguntasActuales.length > 0 && (
          <>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" color="secondary.main" fontWeight="bold" gutterBottom>
              3. Responder Preguntas
            </Typography>
            {preguntasActuales.map((p, idx) => (
              <Accordion key={p._id} expanded={expanded === p._id}
                onChange={() => setExpanded(expanded === p._id ? false : p._id)}
                sx={{ mb: 1, '&:before': { display: 'none' }, border: '1px solid #e0e0e0' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}
                  sx={{ bgcolor: expanded === p._id ? '#e3f2fd' : 'background.paper' }}>
                  <Typography fontWeight="bold" color={expanded === p._id ? 'primary.main' : 'text.primary'}>
                    {idx + 1}. {p.nombre}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  {p.tipo === 'texto' && (
                    <TextField fullWidth label="Respuesta" value={respuestas[p._id] || ''}
                      onChange={e => handleRespChange(p._id, e.target.value)} />
                  )}
                  {p.tipo === 'numero' && (
                    <TextField fullWidth type="number" label="Valor numérico" value={respuestas[p._id] || ''}
                      onChange={e => handleRespChange(p._id, e.target.value)} />
                  )}
                  {p.tipo === 'booleano' && (
                    <FormControlLabel
                      control={<Switch checked={!!respuestas[p._id]}
                        onChange={e => handleRespChange(p._id, e.target.checked)} />}
                      label={respuestas[p._id] ? 'SÍ' : 'NO'}
                    />
                  )}
                  {p.tipo === 'simple' && Array.isArray(p.data) && (
                    <FormControl>
                      <FormLabel sx={{ mb: 1 }}>Selecciona una opción</FormLabel>
                      <RadioGroup value={respuestas[p._id] || ''}
                        onChange={e => handleRespChange(p._id, e.target.value)}>
                        {p.data.map((opt, i) => <FormControlLabel key={i} value={opt} control={<Radio />} label={opt} />)}
                      </RadioGroup>
                    </FormControl>
                  )}
                  {p.tipo === 'multiple' && Array.isArray(p.data) && (
                    <FormControl component="fieldset">
                      <FormLabel sx={{ mb: 1 }}>Selecciona una o varias</FormLabel>
                      <FormGroup>
                        {p.data.map((opt, i) => {
                          const checked = (respuestas[p._id] || []).includes(opt);
                          return <FormControlLabel key={i} control={
                            <Checkbox checked={checked}
                              onChange={e => handleRespChange(p._id, e.target.checked, true, opt)} />
                          } label={opt} />;
                        })}
                      </FormGroup>
                    </FormControl>
                  )}
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button variant="contained" onClick={() => nextQuestion(idx)}>
                      {idx + 1 === preguntasActuales.length ? 'Finalizar' : 'Siguiente'}
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </>
        )}

        <Box display="flex" justifyContent="flex-end" mt={4}>
          <Button variant="contained" color="success" size="large" startIcon={<SendIcon />} onClick={handleGuardar}>
            Guardar Encuesta
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
