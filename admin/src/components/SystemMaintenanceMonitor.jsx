// System Maintenance Monitor - 系統維護監控面板
// Following Kent Beck's TDD principles (Red → Green → Refactor)
// Displays system status, maintenance history, and error monitoring

import React, { useState, useEffect } from 'react';
import {
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
  Box,
  Alert,
  Chip,
  CircularProgress,
  Grid,
  Skeleton
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Build as BuildIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';

export default function SystemMaintenanceMonitor() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extensionStatus, setExtensionStatus] = useState(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [generationErrors, setGenerationErrors] = useState([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState('');

  // Load all data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch extension status
      const statusResponse = await axios.get('/api/system/extension-status');
      setExtensionStatus(statusResponse.data);

      // Fetch maintenance history
      const historyResponse = await axios.get('/api/system/maintenance-history');
      setMaintenanceHistory(historyResponse.data.records || []);

      // Fetch unresolved errors
      const errorsResponse = await axios.get('/api/system/generation-errors?unresolved=true');
      setGenerationErrors(errorsResponse.data.errors || []);

    } catch (err) {
      setError('載入失敗');
      console.error('Failed to load system data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Trigger manual maintenance
  const triggerMaintenance = async () => {
    try {
      setIsTriggering(true);
      setTriggerMessage('');

      const response = await axios.post('/api/system/trigger-maintenance');
      
      if (response.data.success) {
        setTriggerMessage('維護完成');
        // Reload data after successful maintenance
        await loadData();
      } else {
        setTriggerMessage('維護失敗');
      }
    } catch (err) {
      setTriggerMessage('維護失敗');
      console.error('Failed to trigger maintenance:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '進行中';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Skeleton loading components for better UX
  const ExtensionStatusSkeleton = () => (
    <Card data-testid="extension-status-skeleton">
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="40%" />
          <Skeleton variant="text" width="30%" />
          <Skeleton variant="text" width="50%" />
          <Skeleton variant="text" width="35%" />
        </Box>
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" width={120} height={36} />
        </Box>
      </CardContent>
    </Card>
  );

  const MaintenanceHistorySkeleton = () => (
    <Card data-testid="maintenance-history-skeleton">
      <CardContent>
        <Skeleton variant="text" width="40%" height={32} />
        <Box sx={{ mt: 2 }}>
          {[1, 2, 3].map((row) => (
            <Box key={row} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Skeleton variant="text" width="20%" />
              <Skeleton variant="text" width="15%" />
              <Skeleton variant="text" width="10%" />
              <Skeleton variant="text" width="10%" />
              <Skeleton variant="text" width="15%" />
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          系統維護監控面板
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ExtensionStatusSkeleton />
          </Grid>
          <Grid item xs={12} md={6}>
            <MaintenanceHistorySkeleton />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
        <Button onClick={loadData} startIcon={<RefreshIcon />} sx={{ ml: 2 }}>
          重試
        </Button>
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        系統維護監控面板
      </Typography>

      <Grid container spacing={3}>
        {/* Extension Status Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <CheckCircleIcon color="primary" sx={{ mr: 1, verticalAlign: 'middle' }} />
                系統延伸狀態
              </Typography>
              
              {extensionStatus && (
                <Box>
                  <Typography variant="body1">
                    總事件數: {extensionStatus.total_events || 0}
                  </Typography>
                  <Typography variant="body1">
                    需要延伸: {extensionStatus.events_need_extension || 0}
                  </Typography>
                  <Typography variant="body1">
                    目標年份: {extensionStatus.target_extension_year || 'N/A'}
                  </Typography>
                  {extensionStatus.min_extended_year && (
                    <Typography variant="body2" color="text.secondary">
                      延伸範圍: {extensionStatus.min_extended_year} - {extensionStatus.max_extended_year}
                    </Typography>
                  )}
                </Box>
              )}

              <Box mt={2}>
                <Button
                  variant="contained"
                  startIcon={isTriggering ? <CircularProgress size={16} /> : <BuildIcon />}
                  onClick={triggerMaintenance}
                  disabled={isTriggering}
                  color="primary"
                >
                  {isTriggering ? '維護中...' : '手動觸發維護'}
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadData}
                  sx={{ ml: 1 }}
                >
                  重新整理
                </Button>
              </Box>

              {triggerMessage && (
                <Alert 
                  severity={triggerMessage.includes('完成') ? 'success' : 'error'} 
                  sx={{ mt: 2 }}
                >
                  {triggerMessage}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Error Summary Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ErrorIcon color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
                錯誤記錄
              </Typography>
              
              <Typography variant="body1">
                未解決錯誤: {generationErrors.length}
              </Typography>

              {generationErrors.length > 0 && (
                <Box mt={2}>
                  {generationErrors.slice(0, 3).map((error) => (
                    <Box key={error.id} mb={1}>
                      <Chip 
                        label={error.error_type} 
                        size="small" 
                        color="warning" 
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" component="span">
                        {error.event_title || `事件 ${error.event_id}`}
                      </Typography>
                    </Box>
                  ))}
                  {generationErrors.length > 3 && (
                    <Typography variant="body2" color="text.secondary">
                      還有 {generationErrors.length - 3} 個錯誤...
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance History Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                維護歷史
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>維護類型</TableCell>
                      <TableCell>目標年份</TableCell>
                      <TableCell>處理事件數</TableCell>
                      <TableCell>開始時間</TableCell>
                      <TableCell>完成時間</TableCell>
                      <TableCell>狀態</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            暫無維護記錄
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      maintenanceHistory.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.maintenance_type}</TableCell>
                          <TableCell>{record.target_year}</TableCell>
                          <TableCell>{record.events_processed || 0}</TableCell>
                          <TableCell>{formatDate(record.started_at)}</TableCell>
                          <TableCell>{formatDate(record.completed_at)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={record.status} 
                              color={getStatusColor(record.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}