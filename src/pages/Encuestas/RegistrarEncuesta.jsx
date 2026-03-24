import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, TextField, MenuItem,
  Accordion, AccordionSummary, AccordionDetails, Radio, RadioGroup,
  FormControlLabel, FormControl, FormLabel, Checkbox, FormGroup, Switch, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import api from '../../api/api';

export default function RegistrarEncuesta() {
  const [usuarios, setUsuarios] = useState([]);
  const [formularios, setFormularios] = useState([]);
  const [usuarioSelect, setUsuarioSelect] = useState('');
  const [formSelect, setFormSelect] = useState('');

  // Data del formulario cargado
  const [preguntasActuales, setPreguntasActuales] = useState([]);
  const [expanded, setExpanded] = useState(false); // ID del detalle actual expandido

  // Respuestas dinámicas
  const [respuestas, setRespuestas] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, fRes] = await Promise.all([
          api.get('/usuarios'),
          api.get('/formularios')
        ]);
        setUsuarios(uRes.data);
        setFormularios(fRes.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  // Cargar las preguntas del formulario seleccionado y aplanarlas visualmente
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
    } else {
      setPreguntasActuales([]);
    }
  };

  const handleRespChange = (preguntaId, valor, isMultiple = false, itemMultiple = null) => {
    if (isMultiple) {
      const prev = Array.isArray(respuestas[preguntaId]) ? respuestas[preguntaId] : [];
      let newSelection = [...prev];
      if (valor) { // if checked
        newSelection.push(itemMultiple);
      } else { // if unchecked
        newSelection = newSelection.filter(v => v !== itemMultiple);
      }
      setRespuestas({ ...respuestas, [preguntaId]: newSelection });
    } else {
      setRespuestas({ ...respuestas, [preguntaId]: valor });
    }
  };

  const nextQuestion = (currentIndex) => {
    if (currentIndex + 1 < preguntasActuales.length) {
      setExpanded(preguntasActuales[currentIndex + 1]._id);
    } else {
      setExpanded(false); // Close all 
    }
  };

  const handleSaveEncuesta = async () => {
    if (!usuarioSelect || !formSelect) return alert('Selecciona Usuario y Formulario');
    
    // Convert object a array de respuestas
    const respArray = Object.keys(respuestas).map(key => ({
      pregunta_id: key,
      respuesta: respuestas[key]
    }));

    if (respArray.length === 0) return alert('Debes responder al menos una pregunta');

    try {
      await api.post('/encuestas', {
        formulario_id: formSelect,
        usuario_id: usuarioSelect,
        respuestas: respArray
      });
      alert('Encuesta registrada exitosamente');
      setUsuarioSelect('');
      setFormSelect('');
      setPreguntasActuales([]);
      setRespuestas({});
    } catch (error) {
      console.error(error);
      alert('Error registrando encuesta');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
        Registrar Caracterización
      </Typography>

      <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" color="secondary.main" gutterBottom>1. Configuración de Encuesta</Typography>
        <Box display="flex" gap={3} my={3}>
          <TextField 
            select fullWidth label="Seleccionar Ciudadano / Población" 
            value={usuarioSelect} onChange={(e) => setUsuarioSelect(e.target.value)}
          >
            {usuarios.map(u => <MenuItem key={u._id} value={u._id}>{u.nombre} {u.apellido}</MenuItem>)}
          </TextField>

          <TextField 
            select fullWidth label="Seleccionar Formulario Personalizado" 
            value={formSelect} onChange={handleFormSelect}
          >
            {formularios.map(f => <MenuItem key={f._id} value={f._id}>{f.titulo}</MenuItem>)}
          </TextField>
        </Box>

        <Divider sx={{ my: 4 }} />

        {preguntasActuales.length > 0 && (
          <>
            <Typography variant="h6" color="secondary.main" gutterBottom>2. Completar Formulario</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>Responde y presiona "Siguiente" para avanzar.</Typography>
            
            <Box mb={4}>
              {preguntasActuales.map((p, index) => {
                const isOpen = expanded === p._id;

                return (
                  <Accordion 
                    key={p._id} 
                    expanded={isOpen} 
                    onChange={() => setExpanded(isOpen ? false : p._id)}
                    sx={{ border: '1px solid #e0e0e0', mb: 1, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: isOpen ? 'primary.50' : 'background.paper' }}>
                      <Typography fontWeight="bold" color={isOpen ? 'primary.main' : 'text.primary'}>
                        {index + 1}. {p.nombre}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 3 }}>
                      
                      {/* RENDER INGRESO DEPENDIENDO EL TIPO */}
                      {p.tipo === 'texto' && (
                        <TextField 
                          fullWidth placeholder="Escribe la respuesta..." 
                          value={respuestas[p._id] || ''} onChange={(e) => handleRespChange(p._id, e.target.value)}
                        />
                      )}

                      {p.tipo === 'numero' && (
                        <TextField 
                          fullWidth type="number" placeholder="Ingresa el valor numérico" 
                          value={respuestas[p._id] || ''} onChange={(e) => handleRespChange(p._id, e.target.value)}
                        />
                      )}

                      {p.tipo === 'booleano' && (
                        <FormControlLabel 
                          control={<Switch checked={!!respuestas[p._id]} onChange={(e) => handleRespChange(p._id, e.target.checked)} />}
                          label={respuestas[p._id] ? 'SÍ' : 'NO'}
                        />
                      )}

                      {p.tipo === 'simple' && p.data && (
                        <FormControl>
                          <FormLabel sx={{ mb: 1 }}>Selecciona una única opción</FormLabel>
                          <RadioGroup 
                            value={respuestas[p._id] || ''} 
                            onChange={(e) => handleRespChange(p._id, e.target.value)}
                          >
                            {p.data.map((opt, i) => (
                              <FormControlLabel key={i} value={opt} control={<Radio />} label={opt} />
                            ))}
                          </RadioGroup>
                        </FormControl>
                      )}

                      {p.tipo === 'multiple' && p.data && (
                        <FormControl component="fieldset">
                          <FormLabel sx={{ mb: 1 }}>Puedes seleccionar múltiples opciones</FormLabel>
                          <FormGroup>
                            {p.data.map((opt, i) => {
                              const checkedList = respuestas[p._id] || [];
                              const isChecked = checkedList.includes(opt);
                              return (
                                <FormControlLabel 
                                  key={i} 
                                  control={
                                    <Checkbox checked={isChecked} onChange={(e) => handleRespChange(p._id, e.target.checked, true, opt)} />
                                  } 
                                  label={opt} 
                                />
                              )
                            })}
                          </FormGroup>
                        </FormControl>
                      )}

                      <Box display="flex" justifyContent="flex-end" mt={3}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={() => nextQuestion(index)}
                        >
                          {index + 1 === preguntasActuales.length ? 'Finalizar Todo' : 'Siguiente Pregunta'}
                        </Button>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )
              })}
            </Box>

            <Box display="flex" justifyContent="flex-start" mt={2}>
              <Button variant="contained" color="success" size="large" onClick={handleSaveEncuesta} startIcon={<SendIcon />}>
                Guardar Encuesta de Caracterización
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
