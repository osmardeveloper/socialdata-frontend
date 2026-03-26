import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box, Typography, Button, Paper, TextField, MenuItem, Divider,
  Accordion, AccordionSummary, AccordionDetails, Switch, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, Checkbox, FormGroup, InputAdornment,
  CircularProgress, Dialog, DialogTitle, DialogContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Grid
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CloseIcon from '@mui/icons-material/Close';
import CakeIcon from '@mui/icons-material/Cake';
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
  tipo_documento: 'Cédula de Ciudadanía',
  numero_documento: '',
  nombre: '',
  apellido: '',
  direccion: '',
  telefono: '',
  correo: '',
  fecha_nacimiento: '',
  edad: ''
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';
  const hoy = new Date();
  const cumple = new Date(fechaNacimiento);
  if (isNaN(cumple.getTime())) return '';
  let edad = hoy.getFullYear() - cumple.getFullYear();
  const m = hoy.getMonth() - cumple.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
    edad--;
  }
  return edad;
};

// COMPONENTE RECURSIVO PARA RENDERIZAR PREGUNTAS Y SUB-PREGUNTAS
function QuestionRenderer({ pregunta, respuestas, onRespChange, level = 0 }) {
  const p = pregunta;
  const pId = p._id || p.id || `sub-${p.nombre}-${level}`;
  const isSelected = (optText) => {
    const current = respuestas[pId];
    if (Array.isArray(current)) return current.includes(optText);
    return current === optText;
  };
  return (
    <Box sx={{ mt: 1, mb: 2, pl: level > 0 ? 3 : 0, borderLeft: level > 0 ? '2px solid #1565C0' : 'none', bgcolor: level > 0 ? 'rgba(0,0,0,0.02)' : 'transparent', p: level > 0 ? 1 : 0, borderRadius: 1 }}>
      <Typography variant={level === 0 ? "body1" : "body2"} fontWeight="bold" gutterBottom>{p.nombre}</Typography>
      {p.tipo === 'texto' && <TextField fullWidth size="small" value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)} />}
      {p.tipo === 'numero' && <TextField fullWidth size="small" type="number" value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)} />}
      {p.tipo === 'booleano' && <FormControlLabel control={<Switch checked={!!respuestas[pId]} onChange={(e) => onRespChange(pId, e.target.checked)} />} label={respuestas[pId] ? 'SÍ' : 'NO'} />}
      {p.tipo === 'simple' && p.data && (
        <FormControl component="fieldset">
          <RadioGroup value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)}>
            {p.data.map((opt, i) => {
              const optText = typeof opt === 'string' ? opt : opt.text;
              return (
                <Box key={i}>
                  <FormControlLabel value={optText} control={<Radio />} label={optText} />
                  {opt.subPreguntas?.length > 0 && isSelected(optText) && (
                    <Box sx={{ mt: 1 }}>{opt.subPreguntas.map((sp, spi) => <QuestionRenderer key={spi} pregunta={sp} respuestas={respuestas} onRespChange={onRespChange} level={level + 1} />)}</Box>
                  )}
                </Box>
              );
            })}
          </RadioGroup>
        </FormControl>
      )}
      {p.tipo === 'multiple' && p.data && (
        <FormControl component="fieldset">
          <FormGroup>
            {p.data.map((opt, i) => {
              const optText = typeof opt === 'string' ? opt : opt.text;
              const isChecked = (respuestas[pId] || []).includes(optText);
              return (
                <Box key={i}>
                  <FormControlLabel control={<Checkbox checked={isChecked} onChange={(e) => onRespChange(pId, e.target.checked, true, optText)} />} label={optText} />
                  {opt.subPreguntas?.length > 0 && isChecked && (
                    <Box sx={{ mt: 1 }}>{opt.subPreguntas.map((sp, spi) => <QuestionRenderer key={spi} pregunta={sp} respuestas={respuestas} onRespChange={onRespChange} level={level + 1} />)}</Box>
                  )}
                </Box>
              );
            })}
          </FormGroup>
        </FormControl>
      )}
    </Box>
  );
}

export default function NuevaEncuesta() {
  const [usuarios, setUsuarios] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [formSelect, setFormSelect] = useState('');
  const [preguntasActuales, setPreguntasActuales] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [userData, setUserData] = useState(EMPTY_USER);
  const [usuarioEncontrado, setUsuarioEncontrado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const debounceRef = useRef(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      const [uRes, fRes] = await Promise.all([api.get('/usuarios'), api.get('/formularios')]);
      setUsuarios(uRes.data); setFormularios(fRes.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (userData.fecha_nacimiento) { setUserData(prev => ({ ...prev, edad: calcularEdad(userData.fecha_nacimiento) })); }
  }, [userData.fecha_nacimiento]);

  const handleSelectUser = (user) => {
    setUsuarioEncontrado(user);
    setUserData({ ...user, fecha_nacimiento: user.fecha_nacimiento?.split('T')[0] || '', edad: user.edad || calcularEdad(user.fecha_nacimiento) });
    setUserModalOpen(false);
  };

  const handleDocumentoChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setUserData(prev => ({ ...prev, numero_documento: val }));
    setUsuarioEncontrado(null);
    clearTimeout(debounceRef.current);
    if (val.length >= 4) {
      setBuscando(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const { data } = await api.get(`/usuarios/buscar?numero_documento=${val}`);
          handleSelectUser(data);
        } catch { setUsuarioEncontrado(null); }
        setBuscando(false);
      }, 600);
    } else { setBuscando(false); }
  };

  const handleFormSelect = (e) => {
    const formId = e.target.value;
    setFormSelect(formId);
    const form = formularios.find(f => f._id === formId || f.id === formId);
    if (form) {
      const flat = form.preguntas.flatMap(b => b.detalles);
      setPreguntasActuales(flat);
      if (flat.length > 0) setExpanded(flat[0]._id || flat[0].id);
      setRespuestas({});
    }
  };

  const handleRespChange = (pregId, valor, isMultiple = false, item = null) => {
    if (isMultiple) {
      const prev = Array.isArray(respuestas[pregId]) ? respuestas[pregId] : [];
      const next = valor ? [...prev, item] : prev.filter(v => v !== item);
      setRespuestas({ ...respuestas, [pregId]: next });
    } else { setRespuestas({ ...respuestas, [pregId]: valor }); }
  };

  const handleGuardar = async () => {
    if (!userData.numero_documento || !userData.nombre || !formSelect) return alert('Completa los campos obligatorios');
    try {
      let userId = usuarioEncontrado?._id || usuarioEncontrado?._localId;
      if (!userId) {
        const { data: newUser } = await api.post('/usuarios', userData);
        userId = newUser._id || newUser.id;
      }
      const respArray = Object.keys(respuestas).map(k => ({
        pregunta_id: k.startsWith('sub-') ? null : k,
        pregunta_nombre: k.startsWith('sub-') ? k : null,
        respuesta: respuestas[k]
      }));
      await api.post('/encuestas', { formulario_id: formSelect, usuario_id: userId, respuestas: respArray });
      alert('¡Encuesta guardada con éxito!');
      setUserData(EMPTY_USER); setUsuarioEncontrado(null); setFormSelect(''); setPreguntasActuales([]); setRespuestas({});
      loadData();
    } catch (err) { alert('Error al guardar: ' + (err.response?.data?.message || err.message)); }
  };

  const filteredUsers = useMemo(() => {
    return usuarios.filter(u => `${u.nombre} ${u.apellido} ${u.numero_documento}`.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [usuarios, searchQuery]);

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>Nueva Caracterización</Typography>
      <Paper sx={{ p: 4, mb: 3, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" color="secondary.main" fontWeight="bold">1. Datos del Ciudadano</Typography>
          <Button variant="outlined" startIcon={<PersonSearchIcon />} onClick={() => setUserModalOpen(true)}>Buscador de Ciudadanos</Button>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              select fullWidth label="Tipo de Documento"
              value={userData.tipo_documento}
              onChange={e => setUserData({ ...userData, tipo_documento: e.target.value })}
              disabled={!!usuarioEncontrado} size="small"
              SelectProps={{ displayEmpty: true }}
            >
              <MenuItem value="" disabled>Seleccione tipo...</MenuItem>
              {TIPOS_DOCUMENTO.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Número de Documento"
              value={userData.numero_documento}
              onChange={handleDocumentoChange}
              size="small"
              sx={{ maxWidth: '180px' }}
              InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />, endAdornment: buscando ? <CircularProgress size={18} /> : null }}
              helperText={usuarioEncontrado ? `✔ Ciudadano: ${usuarioEncontrado.nombre} ${usuarioEncontrado.apellido}` : ''}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Nombre" value={userData.nombre} onChange={e => setUserData({ ...userData, nombre: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Apellido" value={userData.apellido} onChange={e => setUserData({ ...userData, apellido: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>

          <Grid item xs={12} sm={10}>
            <TextField fullWidth label="Fecha de Nacimiento" type="date" InputLabelProps={{ shrink: true }} value={userData.fecha_nacimiento} onChange={e => setUserData({ ...userData, fecha_nacimiento: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>
          <Grid item xs={12} sm={2} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <TextField label="Edad" value={userData.edad} disabled size="small" sx={{ maxWidth: '80px' }} InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon fontSize="small" /></InputAdornment> }} />
          </Grid>

          <Grid item xs={12} sm={8}>
            <TextField fullWidth label="Correo Electrónico" type="email" value={userData.correo} onChange={e => setUserData({ ...userData, correo: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Teléfono" value={userData.telefono} onChange={e => setUserData({ ...userData, telefono: e.target.value.replace(/\D/g, '') })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>

          <Grid item xs={12}>
            <TextField fullWidth label="Dirección de Residencia" multiline rows={2} value={userData.direccion} onChange={e => setUserData({ ...userData, direccion: e.target.value })} disabled={!!usuarioEncontrado} size="small" />
          </Grid>
        </Grid>

        {usuarioEncontrado && (<Button size="small" variant="text" color="error" sx={{ mt: 1 }} onClick={() => { setUsuarioEncontrado(null); setUserData(EMPTY_USER); }}>Limpiar y nuevo registro</Button>)}

        <Divider sx={{ my: 4 }} />
        <Typography variant="h6" color="secondary.main" fontWeight="bold" gutterBottom>2. Caracterización</Typography>
        <TextField select fullWidth label="Seleccionar Formulario" value={formSelect} onChange={handleFormSelect} sx={{ mb: 3 }}>
          {formularios.map(f => <MenuItem key={f._id || f.id} value={f._id || f.id}>{f.titulo}</MenuItem>)}
        </TextField>

        {preguntasActuales.length > 0 && (
          <Box>
            {preguntasActuales.map((p, idx) => (
              <Accordion key={p._id || p.id} expanded={expanded === (p._id || p.id)} onChange={() => setExpanded(expanded === (p._id || p.id) ? false : (p._id || p.id))} sx={{ mb: 1, border: '1px solid #eee' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: expanded === (p._id || p.id) ? '#e3f2fd' : 'white' }}>
                  <Typography fontWeight="bold">{idx + 1}. {p.nombre}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <QuestionRenderer pregunta={p} respuestas={respuestas} onRespChange={handleRespChange} />
                  <Divider sx={{ my: 2 }} />
                  <Button variant="outlined" onClick={() => setExpanded(preguntasActuales[idx + 1]?._id || preguntasActuales[idx + 1]?.id || false)}>Continuar</Button>
                </AccordionDetails>
              </Accordion>
            ))}
            <Button variant="contained" color="success" size="large" fullWidth sx={{ mt: 3, py: 2 }} onClick={handleGuardar} startIcon={<SendIcon />}>Guardar Encuesta de Caracterización</Button>
          </Box>
        )}
      </Paper>

      <Dialog open={userModalOpen} onClose={() => setUserModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}> Selección de Ciudadano <IconButton onClick={() => setUserModalOpen(false)} color="inherit"><CloseIcon /></IconButton> </DialogTitle>
        <DialogContent dividers>
          <TextField fullWidth placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ mb: 2 }} InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }} />
          <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400 }}>
            <Table stickyHeader>
              <TableHead><TableRow><TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell><TableCell sx={{ fontWeight: 'bold' }}>Documento</TableCell><TableCell sx={{ fontWeight: 'bold' }}>Dirección</TableCell><TableCell align="center" sx={{ fontWeight: 'bold' }}>Acción</TableCell></TableRow></TableHead>
              <TableBody>
                {filteredUsers.map(u => (<TableRow key={u._id || u.id} hover><TableCell>{u.nombre} {u.apellido}</TableCell><TableCell>{u.numero_documento}</TableCell><TableCell>{u.direccion || '—'}</TableCell><TableCell align="center"><Button variant="contained" size="small" onClick={() => handleSelectUser(u)}>Seleccionar</Button></TableCell></TableRow>))}
                {filteredUsers.length === 0 && <TableRow><TableCell colSpan={4} align="center">No se encontraron ciudadanos</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
