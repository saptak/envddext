import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
} from "@mui/material";
import { createDockerDesktopClient } from "@docker/extension-api-client";
import { getGatewayYAML, getHTTPRouteYAML, deleteGateway, deleteHTTPRoute } from "../helper/kubernetes";

const ddClient = createDockerDesktopClient();

interface ResourceActionDialogProps {
  open: boolean;
  onClose: () => void;
  action: "delete" | "viewYaml";
  resourceType: "Gateway" | "HTTPRoute";
  resourceName: string;
  resourceNamespace: string;
  onSuccess?: () => void;
}

export const ResourceActionDialog: React.FC<ResourceActionDialogProps> = ({
  open,
  onClose,
  action,
  resourceType,
  resourceName,
  resourceNamespace,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [yamlContent, setYamlContent] = useState<string>("");

  useEffect(() => {
    if (open && action === "viewYaml") {
      fetchYaml();
    }
  }, [open, action, resourceType, resourceName, resourceNamespace]);

  const fetchYaml = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      if (resourceType === "Gateway") {
        result = await getGatewayYAML(ddClient, resourceNamespace, resourceName);
      } else {
        result = await getHTTPRouteYAML(ddClient, resourceNamespace, resourceName);
      }

      if (result.error) {
        setError(result.error);
      } else {
        setYamlContent(result.yaml || "");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch YAML");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (resourceType === "Gateway") {
        result = await deleteGateway(ddClient, resourceNamespace, resourceName);
      } else {
        result = await deleteHTTPRoute(ddClient, resourceNamespace, resourceName);
      }

      if (result.error) {
        setError(result.error);
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete resource");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setYamlContent("");
    setError(null);
    onClose();
  };

  const getTitle = () => {
    if (action === "delete") {
      return `Delete ${resourceType}`;
    } else {
      return `${resourceType} YAML`;
    }
  };

  const getContent = () => {
    if (action === "delete") {
      return (
        <Box>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this {resourceType.toLowerCase()}?
          </Typography>
          <Paper sx={{ p: 2, mt: 2, backgroundColor: "action.hover" }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Name:</strong> {resourceName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Namespace:</strong> {resourceNamespace}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Type:</strong> {resourceType}
            </Typography>
          </Paper>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This action cannot be undone. The {resourceType.toLowerCase()} will be permanently removed from your cluster.
          </Alert>
        </Box>
      );
    } else {
      return (
        <Box>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper
              sx={{
                p: 2,
                backgroundColor: "grey.900",
                color: "common.white",
                border: "1px solid",
                borderColor: "divider",
                maxHeight: "500px",
                overflow: "auto",
                ...(theme => theme.palette.mode === 'light' && {
                  backgroundColor: 'grey.100',
                  color: 'text.primary'
                })
              }}
            >
              <Typography
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  whiteSpace: "pre-wrap",
                  margin: 0,
                  color: "text.primary",
                }}
              >
                {yamlContent}
              </Typography>
            </Paper>
          )}
        </Box>
      );
    }
  };

  const getActions = () => {
    if (action === "delete") {
      return (
        <>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : undefined}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </>
      );
    } else {
      return (
        <Button onClick={handleClose} variant="contained">
          Close
        </Button>
      );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={action === "viewYaml" ? "md" : "sm"}
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <DialogTitle>{getTitle()}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {getContent()}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {getActions()}
      </DialogActions>
    </Dialog>
  );
};