import React from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Delete,
  Visibility,
  Refresh,
} from "@mui/icons-material";

interface ResourceCardProps {
  type: "Gateway" | "HTTPRoute";
  name: string;
  namespace: string;
  status?: {
    condition?: string;
    ready?: boolean;
    message?: string;
  };
  details: {
    [key: string]: string | number | string[];
  };
  onDelete?: () => void;
  onViewYaml?: () => void;
  onRefresh?: () => void;
}

const getStatusColor = (status?: { condition?: string; ready?: boolean }) => {
  if (!status) return "default";
  if (status.ready === true || status.condition === "Ready") return "success";
  if (status.condition === "Pending" || status.condition === "Programmed") return "warning";
  if (status.ready === false || status.condition === "Failed") return "error";
  return "info";
};

const getStatusIcon = (status?: { condition?: string; ready?: boolean }) => {
  const color = getStatusColor(status);
  switch (color) {
    case "success":
      return <CheckCircle color="success" />;
    case "error":
      return <Error color="error" />;
    case "warning":
      return <Warning color="warning" />;
    default:
      return <Info color="info" />;
  }
};

export const ResourceCard: React.FC<ResourceCardProps> = ({
  type,
  name,
  namespace,
  status,
  details,
  onDelete,
  onViewYaml,
  onRefresh,
}) => {
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);

  return (
    <Card
      sx={{
        mb: 2,
        border: 1,
        borderColor: "divider",
        "&:hover": {
          boxShadow: 2,
        },
      }}
    >
      <CardContent>
        {/* Header with name, type, and status */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {type} • {namespace}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {statusIcon}
            <Chip
              label={status?.condition || (status?.ready ? "Ready" : "Unknown")}
              color={statusColor}
              size="small"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Status message if available */}
        {status?.message && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ 
              mb: 2, 
              fontStyle: "italic",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              padding: 1,
              borderRadius: 1,
            }}
          >
            {status.message}
          </Typography>
        )}

        {/* Resource details */}
        <Stack spacing={1}>
          {Object.entries(details).map(([key, value]) => (
            <Box key={key} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                {key}:
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "right", maxWidth: "60%" }}>
                {Array.isArray(value) ? value.join(", ") : value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </CardContent>

      {/* Action buttons */}
      <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
        {onRefresh && (
          <Tooltip title="Refresh status">
            <IconButton size="small" onClick={onRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
        )}
        {onViewYaml && (
          <Tooltip title="View YAML">
            <IconButton size="small" onClick={onViewYaml}>
              <Visibility />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Delete resource">
            <IconButton size="small" onClick={onDelete} color="error">
              <Delete />
            </IconButton>
          </Tooltip>
        )}
      </CardActions>
    </Card>
  );
};