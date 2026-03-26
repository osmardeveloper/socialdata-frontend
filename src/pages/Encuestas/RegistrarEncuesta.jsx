import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, TextField, MenuItem,
  Accordion, AccordionSummary, AccordionDetails, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, Checkbox, FormGroup, Switch, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import api from '../../api/api';

// COMPONENTE RECURSIVO PARA RENDERIZAR PREGUNTAS Y SUB-PREGUNTAS
function QuestionRenderer({ pregunta, respuestas, onRespChange, level = 0 }) {
  const p = pregunta;
  const pId = p._id || p.id || `sub-${p.nombre}-${level}`;
  
  // Helper para saber si una opción está seleccionada
  const isSelected = (optText) => {
    const current = respuestas[pId];
    if (Array.isArray(current)) return current.includes(optText);
    return current === optText;
  };

  return (
    <Box sx={{ 
      mt: 1, 
      mb: 2, 
      pl: level > 0 ? 3 : 0, 
      borderLeft: level > 0 ? '2px solid #1565C0' : 'none',
      bgcolor: level > 0 ? 'rgba(0,0,0,0.02)' : 'transparent',
      p: level > 0 ? 2 : 0,
      borderRadius: 1
    }}>
      <Typography variant={level === 0 ? "body1" : "body2"} fontWeight="bold" gutterBottom>
        {p.nombre}
      </Typography>

      {/* RENDER SEGÚN TIPO */}
      {p.tipo === 'texto' && (
        <TextField fullWidth size="small" placeholder="Respuesta..." value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)} />
      )}

      {p.tipo === 'numero' && (
        <TextField fullWidth size="small" type="number" placeholder="0" value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)} />
      )}

      {p.tipo === 'booleano' && (
        <FormControlLabel control={<Switch checked={!!respuestas[pId]} onChange={(e) => onRespChange(pId, e.target.checked)} />} label={respuestas[pId] ? 'SÍ' : 'NO'} />
      )}

      {(p.tipo === 'simple') && p.data && (
        <FormControl component="fieldset">
          <RadioGroup value={respuestas[pId] || ''} onChange={(e) => onRespChange(pId, e.target.value)}>
            {p.data.map((opt, i) => {
              const optText = typeof opt === 'string' ? opt : opt.text;
              const hasSub = opt.subPreguntas?.length > 0;
              return (
                <Box key={i}>
                  <FormControlLabel value={optText} control={<Radio />} label={optText} />
                  {/* SI TIENE SUB-PREGUNTAS Y ESTÁ SELECCIONADO, RENDERIZAMOS RECURSIVAMENTE */}
                  {hasSub && isSelected(optText) && (
                    <Box sx={{ mt: 1 }}>
                      {opt.subPreguntas.map((sp, spi) => (
                        <QuestionRenderer key={spi} pregunta={sp} respuestas={respuestas} onRespChange={onRespChange} level={level + 1} />
                      ))}
                    </Box>
                  )}
                </Box>
              );
            })}
          </RadioGroup>
        </FormControl>
      )}

      {(p.tipo === 'multiple') && p.data && (
        <FormControl component="fieldset">
          <FormGroup>
            {p.data.map((opt, i) => {
              const optText = typeof opt === 'string' ? opt : opt.text;
              const hasSub = opt.subPreguntas?.length > 0;
              const checkedList = respuestas[pId] || [];
              const isChecked = checkedList.includes(optText);
              
              return (
                <Box key={i}>
                  <FormControlLabel 
                    control={<Checkbox checked={isChecked} onChange={(e) => onRespChange(pId, e.target.checked, true, optText)} />} 
                    label={optText} 
                  />
                  {hasSub && isChecked && (
                    <Box sx={{ mt: 1 }}>
                      {opt.subPreguntas.map((sp, spi) => (
                        <QuestionRenderer key={spi} pregunta={sp} respuestas={respuestas} onRespChange={onRespChange} level={level + 1} />
                      ))}
                    </Box>
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

export default function RegistrarEncuesta() {
  const [usuarios, setUsuarios] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [usuarioSelect, setUsuarioSelect] = useState('');
  const [formSelect, setFormSelect] = useState('');
  const [preguntasActuales, setPreguntasActuales] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [respuestas, setRespuestas] = useState({});

  useEffect(() => {
    api.get('/usuarios').then(res => setUsuarios(res.data));
    api.get('/formularios').then(res => setFormularios(res.data));
  }, []);

  const handleFormSelect = (e) => {
    const formId = e.target.value;
    setFormSelect(formId);
    const formElegido = formularios.find(f => f._id === formId);
    if (formElegido) {
      let flattened = [];
      formElegido.preguntas.forEach(bloque => {
        flattened = [...flattened, ...bloque.detalles];
      });
      setPreguntasActuales(flattened);
      if (flattened.length > 0) setExpanded(flattened[0]._id);
      setRespuestas({});
    }
  };

  const handleRespChange = (preguntaId, valor, isMultiple = false, itemMultiple = null) => {
    if (isMultiple) {
      const prev = Array.isArray(respuestas[preguntaId]) ? respuestas[preguntaId] : [];
      let newSelection = [...prev];
      if (valor) newSelection.push(itemMultiple);
      else newSelection = newSelection.filter(v => v !== itemMultiple);
      setRespuestas({ ...respuestas, [preguntaId]: newSelection });
    } else {
      setRespuestas({ ...respuestas, [preguntaId]: valor });
    }
  };

  const handleSaveEncuesta = async () => {
    if (!usuarioSelect || !formSelect) return alert('Datos incompletos');
    const respArray = Object.keys(respuestas).map(key => ({
      pregunta_id: key.startsWith('sub-') ? null : key, // Identificamos si es main o sub
      pregunta_nombre: key.startsWith('sub-') ? key : null,
      respuesta: respuestas[key]
    }));

    try {
      await api.post('/encuestas', {
        formulario_id: formSelect,
        usuario_id: usuarioSelect,
        respuestas: respArray
      });
      alert('Caracterización guardada con éxito.');
      setUsuarioSelect(''); setFormSelect(''); setPreguntasActuales([]); setRespuestas({});
    } catch (error) { alert('Error al guardar'); }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>Registrar Caracterización</Typography>
      <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Box display="flex" gap={3} mb={4}>
          <TextField select fullWidth label="Ciudadano" value={usuarioSelect} onChange={(e) => setUsuarioSelect(e.target.value)}>
            {usuarios.map(u => <MenuItem key={u._id} value={u._id}>{u.nombre} {u.apellido}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Formulario" value={formSelect} onChange={handleFormSelect}>
            {formularios.map(f => <MenuItem key={f._id} value={f._id}>{f.titulo}</MenuItem>)}
          </TextField>
        </Box>

        {preguntasActuales.length > 0 && (
          <Box>
            {preguntasActuales.map((p, index) => (
              <Accordion 
                key={p._id} 
                expanded={expanded === p._id} 
                onChange={() => setExpanded(expanded === p._id ? false : p._id)}
                sx={{ mb: 1, border: '1px solid #eee' }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: expanded === p._id ? 'primary.50' : 'white' }}>
                  <Typography fontWeight="bold">{index + 1}. {p.nombre}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 3 }}>
                  <QuestionRenderer pregunta={p} respuestas={respuestas} onRespChange={handleRespChange} />
                  <Divider sx={{ my: 2 }} />
                  <Button variant="outlined" onClick={() => setExpanded(preguntasActuales[index + 1]?._id || false)}>
                    {index + 1 === preguntasActuales.length ? 'Revisar Todo' : 'Siguiente'}
                  </Button>
                </AccordionDetails>
              </Accordion>
            ))}
            <Button variant="contained" color="success" size="large" fullWidth sx={{ mt: 3 }} onClick={handleSaveEncuesta} startIcon={<SendIcon />}>
              Guardar Caracterización Final
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
