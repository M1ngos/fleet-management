import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Fade,
  Zoom,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { driverService } from '../services/api';
import { toast } from 'react-toastify';

const DriverManagement = () => {
  const theme = useTheme();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    area: '',
    department: '',
    adminContact: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await driverService.getAll();
      setDrivers(response.data);
    } catch (err) {
      setError('Falha ao buscar motoristas');
      toast.error('Falha ao buscar motoristas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (driver = null) => {
    if (driver) {
      setSelectedDriver(driver);
      setFormData({
        name: driver.name,
        email: driver.email,
        area: driver.area,
        department: driver.department,
        adminContact: driver.adminContact,
      });
    } else {
      setSelectedDriver(null);
      setFormData({
        name: '',
        email: '',
        area: '',
        department: '',
        adminContact: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDriver(null);
    setFormData({
      name: '',
      email: '',
      area: '',
      department: '',
      adminContact: '',
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDriver) {
        await driverService.update(selectedDriver._id, formData);
        toast.success('Motorista atualizado com sucesso');
      } else {
        await driverService.create(formData);
        toast.success('Motorista adicionado com sucesso');
      }
      handleCloseDialog();
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operação falhou');
    }
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Tem certeza que deseja excluir este motorista?')) {
      try {
        await driverService.delete(driverId);
        toast.success('Motorista excluído com sucesso');
        fetchDrivers();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Falha ao excluir motorista');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Fade in={true}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <GroupIcon fontSize="large" />
            Gerenciamento de Motoristas
          </Typography>
          <Tooltip title="Adicionar Motorista">
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
              startIcon={<AddIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: theme.shadows[4],
                '&:hover': {
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              Adicionar Motorista
            </Button>
          </Tooltip>
        </Box>
      </Fade>

      {error && (
        <Zoom in={true}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: theme.shadows[2],
            }}
          >
            {error}
          </Alert>
        </Zoom>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Zoom in={true}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 3,
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <PersonIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total de Motoristas
                    </Typography>
                    <Typography variant="h4">
                      {drivers.length}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
        <Grid item xs={12} md={8}>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Card sx={{ 
              height: '100%', 
              boxShadow: 3,
              borderRadius: 2,
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <BusinessIcon color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Departamentos Ativos
                    </Typography>
                    <Typography variant="h4">
                      {new Set(drivers.map(d => d.department)).size}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Área</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Contato do Administrador</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow 
                    key={driver._id} 
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      },
                    }}
                  >
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PersonIcon color="primary" fontSize="small" />
                        <Typography>{driver.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <EmailIcon color="primary" fontSize="small" />
                        <Typography>{driver.email}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LocationIcon color="primary" fontSize="small" />
                        <Typography>{driver.area}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <BusinessIcon color="primary" fontSize="small" />
                        <Typography>{driver.department}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PhoneIcon color="primary" fontSize="small" />
                        <Typography>{driver.adminContact}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Tooltip title="Editar">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDialog(driver)}
                            sx={{
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(driver._id)}
                            sx={{
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                              },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          {selectedDriver ? (
            <>
              <EditIcon color="primary" />
              Editar Motorista
            </>
          ) : (
            <>
              <AddIcon color="primary" />
              Adicionar Motorista
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nome"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: <PersonIcon color="primary" sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: <EmailIcon color="primary" sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              fullWidth
              label="Área"
              name="area"
              value={formData.area}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: <LocationIcon color="primary" sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              fullWidth
              label="Departamento"
              name="department"
              value={formData.department}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: <BusinessIcon color="primary" sx={{ mr: 1 }} />,
              }}
            />
            <TextField
              fullWidth
              label="Contato do Administrador"
              name="adminContact"
              value={formData.adminContact}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                startAdornment: <PhoneIcon color="primary" sx={{ mr: 1 }} />,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            {selectedDriver ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverManagement; 