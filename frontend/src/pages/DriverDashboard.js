import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { attendanceService } from '../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import LocationMap from '../components/LocationMap';
import LocationIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import MapIcon from '@mui/icons-material/Map';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CoffeeIcon from '@mui/icons-material/Coffee';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

const DriverDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locationWatchId, setLocationWatchId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const checkTodayAttendance = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const response = await attendanceService.getHistory(
        today.toISOString(),
        new Date().toISOString()
      );
      if (response.data.length > 0) {
        setAttendance(response.data[0]);
        if (response.data[0].clockIn && !response.data[0].clockOut) {
          startLocationTracking();
        }
      }
    } catch (err) {
      setError('Falha ao buscar dados de presença');
    }
  }, []);

  useEffect(() => {
    checkTodayAttendance();
    return () => {
      if (locationWatchId) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
    };
  }, [locationWatchId, checkTodayAttendance]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: new Date().toISOString()
        });
      },
      (error) => {
        setLocationError('Error tracking location: ' + error.message);
        toast.error('Location tracking error');
      },
      {
        enableHighAccuracy: true, // Enable high accuracy mode
        timeout: 5000,
        maximumAge: 0, // Don't use cached position
        requireAltitude: true // Request altitude data
      }
    );

    setLocationWatchId(watchId);
  };

  const stopLocationTracking = () => {
    if (locationWatchId) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      // Clear any previous errors
      setLocationError('');
      
      // Show user we're requesting location
      toast.info('Solicitando sua localização...');

      let timeoutId = setTimeout(() => {
        reject(new Error('Location request timed out. Please check your device\'s location settings and try again.'));
      }, 30000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          console.log('Location success:', position);
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: new Date().toISOString()
          };
          setLocation(location);
          resolve(location);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('Location error:', error);
          let errorMessage = 'Falha no acesso à localização: ';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Permissão de localização negada. Por favor, verifique as configurações do seu navegador e permita o acesso à localização para este site.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Informações de localização indisponíveis. Por favor, verifique se os serviços de localização estão ativados no seu dispositivo.';
              break;
            case error.TIMEOUT:
              errorMessage += 'Solicitação de localização expirada. Por favor, verifique as configurações de localização do seu dispositivo e tente novamente.';
              break;
            default:
              errorMessage += 'Erro desconhecido ocorreu.';
          }
          
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true, // Enable high accuracy mode
          timeout: 30000, // 30 seconds timeout
          maximumAge: 0, // Don't use cached position
          requireAltitude: true // Request altitude data
        }
      );
    });
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      console.log('Starting clock in process...');
      const currentLocation = await getCurrentLocation();
      console.log('Got location for clock in:', currentLocation);
      const locationData = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      };
      const response = await attendanceService.clockIn(locationData);
      setAttendance(response.data);
      startLocationTracking();
      toast.success('Entrada registrada com sucesso');
    } catch (err) {
      console.error('Clock in error:', err);
      toast.error(err.message || 'Falha ao registrar entrada');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      console.log('Starting clock out process...');
      
      // Use the last known location from tracking
      if (!location) {
        throw new Error('Nenhum dado de localização disponível. Por favor, tente novamente.');
      }

      console.log('Using last known location for clock out:', location);
      const locationData = {
        latitude: location.latitude,
        longitude: location.longitude
      };
      
      const response = await attendanceService.clockOut(locationData);
      setAttendance(response.data);
      stopLocationTracking();
      toast.success('Saída registrada com sucesso');
    } catch (err) {
      console.error('Clock out error:', err);
      toast.error(err.message || 'Falha ao registrar saída');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakStart = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.startBreak();
      setAttendance(response.data);
      toast.success('Intervalo iniciado');
    } catch (err) {
      console.error('Break start error:', err);
      toast.error(err.response?.data?.message || 'Falha ao iniciar intervalo');
    } finally {
      setLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    setLoading(true);
    try {
      const response = await attendanceService.endBreak();
      setAttendance(response.data);
      toast.success('Intervalo finalizado');
    } catch (err) {
      console.error('Break end error:', err);
      toast.error(err.response?.data?.message || 'Falha ao finalizar intervalo');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDay = async () => {
    setResetDialogOpen(true);
  };

  const confirmResetDay = async () => {
    setResetDialogOpen(false);
    try {
      await attendanceService.deleteToday();
      setAttendance(null);
      setLocation(null);
      toast.success('Dia reiniciado. Você pode registrar entrada novamente.');
    } catch (err) {
      toast.error('Falha ao reiniciar o dia.');
    }
  };

  const handleDeleteRecord = async (attendanceId) => {
    try {
      toast.info('O recurso de exclusão de registro é para desenvolvimento/teste. Implemente a lógica do backend conforme necessário.');
    } catch (err) {
      toast.error('Falha ao excluir registro.');
    }
  };

  const handleShowLocation = (location) => {
    setSelectedLocation(location);
    setShowLocationDialog(true);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, md: 4 }, py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #1e3c72 30%, #2a5298 90%)',
          backgroundClip: 'text',
          textFillColor: 'transparent',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Painel do Motorista
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {format(new Date(), 'd MMMM yyyy')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {attendance?.clockOut && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Dia Concluído!</Typography>
          <Typography sx={{ mt: 1 }}>
            Você registrou saída com sucesso. Total de horas: {attendance.totalHours?.toFixed(2) || 0}
          </Typography>
          {attendance.overtimeHours > 0 && (
            <Typography sx={{ mt: 0.5, color: 'success.dark' }}>
              Horas extras: {attendance.overtimeHours.toFixed(2)}
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
            }
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main'
              }}>
                <LocationIcon /> Localização
              </Typography>
              {location ? (
                <Box>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Latitude</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {location.latitude.toFixed(6)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Longitude</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {location.longitude.toFixed(6)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Precisão</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {location.accuracy.toFixed(2)} metros
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Última atualização</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {format(new Date(location.timestamp), 'HH:mm:ss')}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Button
                    variant="outlined"
                    onClick={() => setShowMap(!showMap)}
                    startIcon={showMap ? <CloseIcon /> : <MapIcon />}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3
                    }}
                  >
                    {showMap ? 'Ocultar Mapa' : 'Mostrar no Mapa'}
                  </Button>
                </Box>
              ) : (
                <Box sx={{ py: 2 }}>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Nenhum dado de localização disponível
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Para registrar entrada, por favor:
                  </Typography>
                  <Box component="ul" sx={{ 
                    pl: 2,
                    '& li': { 
                      mb: 1,
                      color: 'text.secondary'
                    }
                  }}>
                    <li>Ative os serviços de localização no seu dispositivo</li>
                    <li>Permita o acesso à localização no seu navegador</li>
                    <li>Certifique-se de estar em uma área com bom sinal de GPS</li>
                  </Box>
                </Box>
              )}
              {locationError && (
                <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">Erro de Localização</Typography>
                  <Typography sx={{ mt: 1 }}>{locationError}</Typography>
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Passos para solução:</Typography>
                  <Box component="ol" sx={{ 
                    pl: 2,
                    '& li': { 
                      mb: 1,
                      color: 'text.secondary'
                    }
                  }}>
                    <li>Verifique se a localização está ativada no seu dispositivo</li>
                    <li>Certifique-se de que seu navegador tem permissão para acessar a localização</li>
                    <li>Para Chrome/Edge: Clique no ícone de cadeado na barra de endereços → Configurações do site → Permitir localização</li>
                    <li>Para Firefox: Clique no ícone de escudo → Permissões do site → Permitir acesso à localização</li>
                    <li>Para Brave: Verifique as configurações do Brave Shields e certifique-se de que o acesso à localização não está bloqueado</li>
                    <li>Se estiver acessando via HTTP, tente usar HTTPS</li>
                    <li>Tente atualizar a página após alterar as permissões</li>
                  </Box>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {showMap && location && (
          <Grid item xs={12}>
            <LocationMap
              location={location}
              onClose={() => setShowMap(false)}
            />
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
            }
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main'
              }}>
                <AccessTimeIcon /> Registro de Hoje
              </Typography>
              {attendance ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Entrada</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {attendance.clockIn?.time
                        ? format(new Date(attendance.clockIn.time), 'HH:mm:ss')
                        : 'Não registrado'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Saída</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {attendance.clockOut?.time
                        ? format(new Date(attendance.clockOut.time), 'HH:mm:ss')
                        : 'Não registrado'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Início do Intervalo</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {attendance.breakStart
                        ? format(new Date(attendance.breakStart), 'HH:mm:ss')
                        : 'Não iniciado'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Fim do Intervalo</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {attendance.breakEnd
                        ? format(new Date(attendance.breakEnd), 'HH:mm:ss')
                        : 'Não finalizado'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Total de Horas</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {attendance.totalHours?.toFixed(2) || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Horas Extras</Typography>
                    <Typography variant="body1" sx={{ 
                      fontWeight: 500,
                      color: attendance.overtimeHours > 0 ? 'success.main' : 'text.primary'
                    }}>
                      {attendance.overtimeHours?.toFixed(2) || 0}
                    </Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                  Nenhum registro para hoje
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
            }
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main'
              }}>
                <PlayCircleIcon /> Ações
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {!attendance?.clockIn?.time && !attendance?.clockOut?.time && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleClockIn}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 6px 8px rgba(0,0,0,0.15)',
                      }
                    }}
                  >
                    Registrar Entrada
                  </Button>
                )}

                {attendance?.clockIn?.time && !attendance?.clockOut?.time && (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleClockOut}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <LogoutIcon />}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        '&:hover': {
                          boxShadow: '0 6px 8px rgba(0,0,0,0.15)',
                        }
                      }}
                    >
                      Registrar Saída
                    </Button>

                    {!attendance?.breakStart && (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleBreakStart}
                        disabled={loading}
                        startIcon={<CoffeeIcon />}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        Iniciar Intervalo
                      </Button>
                    )}

                    {attendance?.breakStart && !attendance?.breakEnd && (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleBreakEnd}
                        disabled={loading}
                        startIcon={<CoffeeIcon />}
                        sx={{
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1rem'
                        }}
                      >
                        Finalizar Intervalo
                      </Button>
                    )}
                  </>
                )}

                {attendance?.clockOut?.time && (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                    <Typography>Você concluiu seu turno para hoje.</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Total de Horas: {attendance.totalHours?.toFixed(2) || 0}
                      {attendance.overtimeHours > 0 && (
                        <span> (Incluindo {attendance.overtimeHours.toFixed(2)} horas extras)</span>
                      )}
                    </Typography>
                  </Alert>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    color="warning"
                    variant="contained"
                    onClick={handleResetDay}
                    startIcon={<RefreshIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none'
                    }}
                  >
                    Reiniciar Dia
                  </Button>
                  <Button
                    color="error"
                    variant="contained"
                    onClick={() => handleDeleteRecord(attendance?._id)}
                    startIcon={<DeleteIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none'
                    }}
                  >
                    Excluir Registro
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <RefreshIcon color="warning" /> Confirmar Reinício
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja reiniciar o registro de hoje? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setResetDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmResetDay} 
            color="warning" 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              px: 3
            }}
          >
            Reiniciar Dia
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showLocationDialog}
        onClose={() => setShowLocationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationIcon />
            Detalhes da Localização
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedLocation && (
            <LocationMap
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              height={400}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLocationDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DriverDashboard; 