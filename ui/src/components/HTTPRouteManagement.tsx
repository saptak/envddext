import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Grid,
  TextField,
  InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { HTTPRouteCreationForm } from './HTTPRouteCreationForm';
import { HTTPRouteStatusMonitor } from './HTTPRouteStatusMonitor';
import { listHTTPRoutes } from '../helper/kubernetes';
import { HTTPRoute } from '../types/httproute';

const ddClient = createDockerDesktopClient();

interface HTTPRouteManagementProps {
  onHTTPRouteCreated?: (httpRoute: HTTPRoute) => void;
}

export const HTTPRouteManagement: React.FC<HTTPRouteManagementProps> = ({
  onHTTPRouteCreated
}) => {
  const [httpRoutes, setHttpRoutes] = useState<HTTPRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetchHTTPRoutes();
  }, []);

  const fetchHTTPRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await listHTTPRoutes(ddClient);
      
      if (result.error) {
        setError(result.error);
        setHttpRoutes([]);
      } else {
        setHttpRoutes(result.items || []);
      }
    } catch (err: any) {
      setError(typeof err === 'string' ? err : 'Failed to fetch HTTPRoutes');
      setHttpRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (httpRoute: HTTPRoute) => {
    setShowCreateForm(false);
    setCreateSuccess(`HTTPRoute "${httpRoute.metadata.name}" created successfully!`);
    
    // Refresh the HTTPRoute list
    fetchHTTPRoutes();
    
    // Notify parent component
    onHTTPRouteCreated?.(httpRoute);
    
    // Clear success message after 5 seconds
    setTimeout(() => setCreateSuccess(null), 5000);
  };

  const handleHTTPRouteDeleted = (routeName: string, namespace: string) => {
    // Remove the deleted HTTPRoute from the list
    setHttpRoutes(prev => prev.filter(route => 
      !(route.metadata.name === routeName && route.metadata.namespace === namespace)
    ));
  };

  const getHTTPRouteStatusSummary = (httpRoute: HTTPRoute) => {
    const conditions = httpRoute.status?.parents?.[0]?.conditions || [];
    const acceptedCondition = conditions.find(c => c.type === 'Accepted');
    
    if (acceptedCondition) {
      if (acceptedCondition.status === 'True') {
        return { status: 'ready', message: 'HTTPRoute is accepted and ready' };
      } else if (acceptedCondition.status === 'False') {
        return { status: 'failed', message: acceptedCondition.message };
      } else {
        return { status: 'pending', message: acceptedCondition.message };
      }
    }
    
    return { status: 'unknown', message: 'Status unknown' };
  };

  const filteredHTTPRoutes = httpRoutes.filter(route => {
    if (!searchFilter) return true;
    
    const searchLower = searchFilter.toLowerCase();
    return (
      route.metadata.name.toLowerCase().includes(searchLower) ||
      route.metadata.namespace.toLowerCase().includes(searchLower) ||
      (route.spec.hostnames || []).some(hostname => 
        hostname.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          HTTPRoute Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchHTTPRoutes}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowCreateForm(true)}
          >
            Create HTTPRoute
          </Button>
        </Box>
      </Box>

      {createSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setCreateSuccess(null)}>
          {createSuccess}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* HTTPRoute Summary */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              HTTPRoute Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {httpRoutes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total HTTPRoutes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {httpRoutes.filter(route => getHTTPRouteStatusSummary(route).status === 'ready').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {httpRoutes.filter(route => getHTTPRouteStatusSummary(route).status === 'pending').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">
                    {httpRoutes.filter(route => getHTTPRouteStatusSummary(route).status === 'failed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Search and Filter */}
          {httpRoutes.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <TextField
                fullWidth
                placeholder="Search HTTPRoutes by name, namespace, or hostname..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Paper>
          )}

          {/* HTTPRoute List */}
          {filteredHTTPRoutes.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {httpRoutes.length === 0 ? 'No HTTPRoutes Found' : 'No HTTPRoutes Match Your Search'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {httpRoutes.length === 0 
                  ? 'Create your first HTTPRoute to start routing HTTP traffic through Envoy Gateway.'
                  : 'Try adjusting your search criteria to find the HTTPRoutes you\'re looking for.'
                }
              </Typography>
              {httpRoutes.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCreateForm(true)}
                >
                  Create HTTPRoute
                </Button>
              )}
            </Paper>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  HTTPRoutes ({filteredHTTPRoutes.length})
                </Typography>
                {searchFilter && (
                  <Chip
                    label={`Filtered: ${filteredHTTPRoutes.length} of ${httpRoutes.length}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Box>
              {filteredHTTPRoutes.map((httpRoute) => (
                <HTTPRouteStatusMonitor
                  key={`${httpRoute.metadata.namespace}-${httpRoute.metadata.name}`}
                  routeName={httpRoute.metadata.name}
                  namespace={httpRoute.metadata.namespace}
                  onDelete={handleHTTPRouteDeleted}
                />
              ))}
            </Box>
          )}
        </>
      )}

      {/* Create HTTPRoute Dialog */}
      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          Create New HTTPRoute
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <HTTPRouteCreationForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateForm(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};
