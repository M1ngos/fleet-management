import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { driverService, attendanceService } from '../services/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Coffee as CoffeeIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import LocationMap from '../components/LocationMap';

const StatCard = ({ title, value, icon: Icon, color }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              backgroundColor: alpha(color, 0.1),
              borderRadius: '12px',
              p: 1,
              mr: 2,
            }}
          >
            <Icon sx={{ color: color, fontSize: 28 }} />
          </Box>
          <Typography color="textSecondary" variant="subtitle1" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 600, color: color }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    onBreak: 0,
    overtimeDrivers: 0,
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    // Set up polling for active drivers every 10 seconds
    const interval = setInterval(fetchActiveDrivers, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [driversResponse, attendanceResponse] = await Promise.all([
        driverService.getAll(),
        attendanceService.getAdminRecords(
          new Date().toISOString(),
          new Date().toISOString()
        ),
      ]);

      const drivers = driversResponse.data;
      const attendance = attendanceResponse.data;

      const activeDrivers = attendance.filter(
        (record) => record.clockIn && !record.clockOut
      ).length;
      const onBreak = attendance.filter(
        (record) => record.breakStart && !record.breakEnd
      ).length;
      const overtimeDrivers = attendance.filter(
        (record) => record.overtimeHours > 0
      ).length;

      setStats({
        totalDrivers: drivers.length,
        activeDrivers,
        onBreak,
        overtimeDrivers,
      });

      const recent = attendance
        .sort((a, b) => new Date(b.clockIn.time) - new Date(a.clockIn.time))
        .slice(0, 5);
      setRecentAttendance(recent);

      // Fetch active drivers' locations
      await fetchActiveDrivers();
    } catch (err) {
      setError('Falha ao carregar dados do painel');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveDrivers = async () => {
    try {
      setRefreshing(true);
      const response = await attendanceService.getActiveDrivers();
      setActiveDrivers(response.data);
      
      // Update stats with new active drivers count
      setStats(prevStats => ({
        ...prevStats,
        activeDrivers: response.data.length,
        onBreak: response.data.filter(driver => driver.breakStart && !driver.breakEnd).length
      }));
    } catch (err) {
      console.error('Falha ao buscar motoristas ativos:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewDrivers = () => {
    navigate('/drivers');
  };

  const handleViewOvertime = () => {
    navigate('/overtime');
  };

  const handleViewDriverLocation = (driver) => {
    if (!driver.lastLocation) {
      toast.error('Localização não disponível para este motorista');
      return;
    }
    setSelectedDriver(driver);
    setShowMap(true);
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
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          fontWeight: 700,
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Painel do Administrador
      </Typography>

      {error && (
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
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Motoristas"
            value={stats.totalDrivers}
            icon={PeopleIcon}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Motoristas Ativos"
            value={stats.activeDrivers}
            icon={CarIcon}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Em Intervalo"
            value={stats.onBreak}
            icon={CoffeeIcon}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Horas Extras Hoje"
            value={stats.overtimeDrivers}
            icon={AccessTimeIcon}
            color={theme.palette.error.main}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                }}
              >
                Ações Rápidas
              </Typography>
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleViewDrivers}
                  startIcon={<PeopleIcon />}
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
                  Gerenciar Motoristas
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleViewOvertime}
                  startIcon={<AccessTimeIcon />}
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
                  Ver Horas Extras
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              height: '100%',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <LocationIcon /> Localização dos Motoristas
                </Typography>
                <Tooltip title="Atualizar">
                  <IconButton 
                    onClick={fetchActiveDrivers}
                    disabled={refreshing}
                    color="primary"
                  >
                    <RefreshIcon className={refreshing ? 'rotating' : ''} />
                  </IconButton>
                </Tooltip>
              </Box>
              {activeDrivers.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Motorista</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Última Atualização</TableCell>
                        <TableCell align="right">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeDrivers.map((driver) => (
                        <TableRow key={driver._id}>
                          <TableCell>{driver.name}</TableCell>
                          <TableCell>
                            {driver.breakStart && !driver.breakEnd ? (
                              <Typography color="warning.main">Em Intervalo</Typography>
                            ) : (
                              <Typography color="success.main">Ativo</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {driver.lastLocation?.timestamp ? (
                              format(new Date(driver.lastLocation.timestamp), 'HH:mm:ss')
                            ) : (
                              'Não disponível'
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Ver Localização">
                              <IconButton
                                color="primary"
                                onClick={() => handleViewDriverLocation(driver)}
                              >
                                <LocationIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">
                  Nenhum motorista ativo no momento
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card
            sx={{
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
              },
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3,
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                }}
              >
                Registros Recentes
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Motorista</TableCell>
                      <TableCell>Entrada</TableCell>
                      <TableCell>Saída</TableCell>
                      <TableCell>Total de Horas</TableCell>
                      <TableCell>Horas Extras</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentAttendance.map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>{record.driver.name}</TableCell>
                        <TableCell>
                          {format(new Date(record.clockIn.time), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          {record.clockOut?.time
                            ? format(new Date(record.clockOut.time), 'HH:mm:ss')
                            : '-'}
                        </TableCell>
                        <TableCell>{record.totalHours?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Typography
                            color={record.overtimeHours > 0 ? 'success.main' : 'text.primary'}
                          >
                            {record.overtimeHours?.toFixed(2) || '0.00'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {showMap && selectedDriver && (
        <Dialog
          open={showMap}
          onClose={() => setShowMap(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <LocationIcon />
              Localização de {selectedDriver.name}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedDriver.lastLocation ? (
              <LocationMap
                location={{
                  latitude: selectedDriver.lastLocation.latitude,
                  longitude: selectedDriver.lastLocation.longitude,
                  accuracy: selectedDriver.lastLocation.accuracy || 0,
                  timestamp: selectedDriver.lastLocation.timestamp
                }}
                onClose={() => setShowMap(false)}
              />
            ) : (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Localização não disponível
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowMap(false)}>Fechar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default AdminDashboard; 