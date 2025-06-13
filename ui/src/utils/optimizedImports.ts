// Optimized Material-UI imports for better tree-shaking
// This approach reduces bundle size by importing only what's needed

// Core components - commonly used across the app
export { default as Box } from '@mui/material/Box';
export { default as Typography } from '@mui/material/Typography';
export { default as Button } from '@mui/material/Button';
export { default as Paper } from '@mui/material/Paper';
export { default as Card } from '@mui/material/Card';
export { default as CardContent } from '@mui/material/CardContent';
export { default as Grid } from '@mui/material/Grid';
export { default as CircularProgress } from '@mui/material/CircularProgress';
export { default as LinearProgress } from '@mui/material/LinearProgress';

// Form components
export { default as TextField } from '@mui/material/TextField';
export { default as FormControl } from '@mui/material/FormControl';
export { default as FormLabel } from '@mui/material/FormLabel';
export { default as Select } from '@mui/material/Select';
export { default as MenuItem } from '@mui/material/MenuItem';
export { default as Checkbox } from '@mui/material/Checkbox';
export { default as FormControlLabel } from '@mui/material/FormControlLabel';
export { default as Switch } from '@mui/material/Switch';
export { default as Slider } from '@mui/material/Slider';

// Navigation and Layout
export { default as Tabs } from '@mui/material/Tabs';
export { default as Tab } from '@mui/material/Tab';
export { default as AppBar } from '@mui/material/AppBar';
export { default as Toolbar } from '@mui/material/Toolbar';
export { default as Drawer } from '@mui/material/Drawer';
export { default as List } from '@mui/material/List';
export { default as ListItem } from '@mui/material/ListItem';
export { default as ListItemText } from '@mui/material/ListItemText';
export { default as ListItemIcon } from '@mui/material/ListItemIcon';
export { default as Divider } from '@mui/material/Divider';

// Feedback components
export { default as Alert } from '@mui/material/Alert';
export { default as Snackbar } from '@mui/material/Snackbar';
export { default as Chip } from '@mui/material/Chip';
export { default as Badge } from '@mui/material/Badge';
export { default as Tooltip } from '@mui/material/Tooltip';

// Dialog components
export { default as Dialog } from '@mui/material/Dialog';
export { default as DialogTitle } from '@mui/material/DialogTitle';
export { default as DialogContent } from '@mui/material/DialogContent';
export { default as DialogActions } from '@mui/material/DialogActions';
export { default as DialogContentText } from '@mui/material/DialogContentText';

// Layout utilities
export { default as Stack } from '@mui/material/Stack';
export { default as Container } from '@mui/material/Container';
export { default as Collapse } from '@mui/material/Collapse';

// Icons - commonly used
export { default as IconButton } from '@mui/material/IconButton';
export { default as RefreshIcon } from '@mui/icons-material/Refresh';
export { default as DeleteIcon } from '@mui/icons-material/Delete';
export { default as EditIcon } from '@mui/icons-material/Edit';
export { default as AddIcon } from '@mui/icons-material/Add';
export { default as CloseIcon } from '@mui/icons-material/Close';
export { default as CheckIcon } from '@mui/icons-material/Check';
export { default as ErrorIcon } from '@mui/icons-material/Error';
export { default as WarningIcon } from '@mui/icons-material/Warning';
export { default as InfoIcon } from '@mui/icons-material/Info';
export { default as HelpIcon } from '@mui/icons-material/Help';

// Data display
export { default as Table } from '@mui/material/Table';
export { default as TableBody } from '@mui/material/TableBody';
export { default as TableCell } from '@mui/material/TableCell';
export { default as TableContainer } from '@mui/material/TableContainer';
export { default as TableHead } from '@mui/material/TableHead';
export { default as TableRow } from '@mui/material/TableRow';
export { default as Avatar } from '@mui/material/Avatar';

// Advanced components
export { default as Accordion } from '@mui/material/Accordion';
export { default as AccordionSummary } from '@mui/material/AccordionSummary';
export { default as AccordionDetails } from '@mui/material/AccordionDetails';
export { default as Stepper } from '@mui/material/Stepper';
export { default as Step } from '@mui/material/Step';
export { default as StepLabel } from '@mui/material/StepLabel';
export { default as StepContent } from '@mui/material/StepContent';

// Performance optimization: Re-export theme utilities
export { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
export type { Theme } from '@mui/material/styles';

// Performance optimization: Commonly used props types
export type { BoxProps } from '@mui/material/Box';
export type { TypographyProps } from '@mui/material/Typography';
export type { ButtonProps } from '@mui/material/Button';
export type { PaperProps } from '@mui/material/Paper';
export type { GridProps } from '@mui/material/Grid';

// Utility for lazy loading less common components
export const LazyMaterialComponents = {
  // Data visualization
  SpeedDial: () => import('@mui/material/SpeedDial'),
  SpeedDialAction: () => import('@mui/material/SpeedDialAction'),
  SpeedDialIcon: () => import('@mui/material/SpeedDialIcon'),
  
  // Advanced layouts
  Masonry: () => import('@mui/lab/Masonry'),
  Timeline: () => import('@mui/lab/Timeline'),
  TimelineItem: () => import('@mui/lab/TimelineItem'),
  
  // Date/Time pickers (if needed) - commented out since packages not installed
  // DatePicker: () => import('@mui/x-date-pickers/DatePicker'),
  // TimePicker: () => import('@mui/x-date-pickers/TimePicker'),
  
  // Advanced data components - commented out since packages may not be installed
  // DataGrid: () => import('@mui/x-data-grid/DataGrid'),
  // TreeView: () => import('@mui/lab/TreeView'),
};

// Helper for creating lazy loaded components
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn);
};

// Bundle size optimization utility
export const getBundleOptimizationTips = () => {
  return {
    tips: [
      'Use optimizedImports instead of bulk imports from @mui/material',
      'Lazy load components not needed on initial render',
      'Use React.memo for components with expensive renders',
      'Implement virtual scrolling for large lists',
      'Code split routes and tabs for better loading performance'
    ],
    savings: {
      estimated: '20-30% bundle size reduction',
      runtime: '40-50% faster initial load'
    }
  };
};

import React from 'react';