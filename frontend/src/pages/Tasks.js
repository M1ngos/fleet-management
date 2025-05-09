import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  PlayCircle as PlayCircleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { tasksService, driverService } from '../services/api';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const TaskStatus = ({ status }) => {
  const statusConfig = {
    pending: { color: 'warning', icon: <PendingIcon />, label: 'Pendente' },
    in_progress: { color: 'info', icon: <PlayCircleIcon />, label: 'Em Progresso' },
    completed: { color: 'success', icon: <CheckCircleIcon />, label: 'Concluído' },
    cancelled: { color: 'error', icon: <CancelIcon />, label: 'Cancelado' },
  };

  const config = statusConfig[status];

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

const TaskPriority = ({ priority }) => {
  const priorityConfig = {
    low: { color: 'success', label: 'Baixa' },
    medium: { color: 'warning', label: 'Média' },
    high: { color: 'error', label: 'Alta' },
  };

  const config = priorityConfig[priority];

  return (
    <Chip
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

const TaskDialog = ({ open, onClose, task, onSubmit, drivers }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: new Date(),
    assignedTo: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: new Date(task.dueDate),
        assignedTo: task.assignedTo._id,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: new Date(),
        assignedTo: '',
      });
    }
    setErrors({});
  }, [task]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!formData.description.trim()) newErrors.description = 'Descrição é obrigatória';
    if (!formData.assignedTo) newErrors.assignedTo = 'Selecione um motorista';
    if (!formData.dueDate) newErrors.dueDate = 'Data de entrega é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                error={!!errors.title}
                helperText={errors.title}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                error={!!errors.description}
                helperText={errors.description}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={formData.priority}
                  label="Prioridade"
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <MenuItem value="low">Baixa</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Data de Entrega"
                  value={formData.dueDate}
                  onChange={(date) => setFormData({ ...formData, dueDate: date })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                      error={!!errors.dueDate}
                      helperText={errors.dueDate}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.assignedTo}>
                <InputLabel>Atribuir Para</InputLabel>
                <Select
                  value={formData.assignedTo}
                  label="Atribuir Para"
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  required
                >
                  {drivers.map((driver) => (
                    <MenuItem key={driver._id} value={driver._id}>
                      {driver.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.assignedTo && (
                  <FormHelperText>{errors.assignedTo}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            {task ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const user = useSelector((state) => state.auth.user);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let response;
      if (user.role === 'admin') {
        response = await tasksService.getAll();
      } else {
        response = await tasksService.getAssignedTasks();
      }
      setTasks(response.data);
    } catch (error) {
      setError('Erro ao carregar tarefas');
      toast.error('Erro ao carregar tarefas');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await driverService.getAll();
      setDrivers(response.data);
    } catch (error) {
      toast.error('Erro ao carregar motoristas');
    }
  };

  useEffect(() => {
    fetchTasks();
    if (user.role === 'admin') {
      fetchDrivers();
    }
  }, [user.role]);

  const handleCreateTask = async (formData) => {
    try {
      console.log('Creating task with data:', formData);
      const taskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        dueDate: formData.dueDate.toISOString(),
        assignedTo: formData.assignedTo
      };
      console.log('Formatted task data:', taskData);
      const response = await tasksService.create(taskData);
      console.log('Server response:', response);
      toast.success('Tarefa criada com sucesso');
      setDialogOpen(false);
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error.response?.data || error);
      const errorMessage = error.response?.data?.message || 'Erro ao criar tarefa';
      toast.error(errorMessage);
    }
  };

  const handleUpdateTask = async (formData) => {
    try {
      await tasksService.update(selectedTask._id, {
        ...formData,
        dueDate: formData.dueDate.toISOString()
      });
      toast.success('Tarefa atualizada com sucesso');
      setDialogOpen(false);
      fetchTasks();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar tarefa';
      toast.error(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
      try {
        await tasksService.delete(taskId);
        toast.success('Tarefa excluída com sucesso');
        fetchTasks();
      } catch (error) {
        toast.error('Erro ao excluir tarefa');
      }
    }
  };

  const handleStatusUpdate = async (taskId, status) => {
    try {
      await tasksService.updateStatus(taskId, status);
      toast.success('Status atualizado com sucesso');
      fetchTasks();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (tab === 0) return true;
    if (tab === 1) return task.status === 'pending';
    if (tab === 2) return task.status === 'in_progress';
    if (tab === 3) return task.status === 'completed';
    return false;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Tarefas
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedTask(null);
            setDialogOpen(true);
          }}
        >
          Nova Tarefa
        </Button>
      </Box>

      <Tabs
        value={tab}
        onChange={(e, newValue) => setTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Todas" />
        <Tab label="Pendentes" />
        <Tab label="Em Progresso" />
        <Tab label="Concluídas" />
      </Tabs>

      <Grid container spacing={3}>
        {filteredTasks.map((task) => (
          <Grid item xs={12} md={6} lg={4} key={task._id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {task.title}
                  </Typography>
                  <Box>
                    <TaskStatus status={task.status} />
                  </Box>
                </Box>

                <Typography color="textSecondary" paragraph>
                  {task.description}
                </Typography>

                <Stack direction="row" spacing={1} mb={2}>
                  <TaskPriority priority={task.priority} />
                  <Chip
                    label={`Entrega: ${format(new Date(task.dueDate), 'dd/MM/yyyy')}`}
                    size="small"
                  />
                </Stack>

                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Criado por: {task.createdBy.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Atribuído para: {task.assignedTo.name}
                </Typography>

                <Box display="flex" justifyContent="flex-end" mt={2}>
                  {user.role === 'admin' && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedTask(task);
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTask(task._id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                  {task.status === 'pending' && (
                    <Button
                      size="small"
                      startIcon={<PlayCircleIcon />}
                      onClick={() => handleStatusUpdate(task._id, 'in_progress')}
                    >
                      Iniciar
                    </Button>
                  )}
                  {task.status === 'in_progress' && (
                    <Button
                      size="small"
                      color="success"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleStatusUpdate(task._id, 'completed')}
                    >
                      Concluir
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TaskDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        task={selectedTask}
        onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
        drivers={drivers}
      />
    </Box>
  );
};

export default Tasks; 