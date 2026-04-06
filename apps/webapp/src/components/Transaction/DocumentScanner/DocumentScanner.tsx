'use client';

import {CameraAltRounded, CheckRounded, CloseRounded, FlipCameraIosRounded} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';
import {ZoomTransition} from '@/components/Transition';

export type DocumentScannerProps = {
  onCapture: (file: File) => void;
};

type CameraState = 'idle' | 'starting' | 'active' | 'error';

/**
 * DocumentScanner opens a camera dialog, lets the user capture a frame, and
 * returns the result as a JPEG File object via the `onCapture` callback.
 * No external dependencies are needed – it uses the MediaDevices API directly.
 */
export const DocumentScanner: React.FC<DocumentScannerProps> = ({onCapture}) => {
  const [open, setOpen] = React.useState(false);
  const [cameraState, setCameraState] = React.useState<CameraState>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [facingMode, setFacingMode] = React.useState<'environment' | 'user'>('environment');

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stopStream = React.useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  const startCamera = React.useCallback(
    async (mode: 'environment' | 'user') => {
      stopStream();
      setCameraState('starting');
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('error');
        setErrorMessage('Camera access is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {facingMode: {ideal: mode}},
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraState('active');
      } catch (err) {
        setCameraState('error');
        setErrorMessage(
          err instanceof Error && err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access.'
            : 'Could not access camera. Please ensure a camera is connected.',
        );
      }
    },
    [stopStream],
  );

  const handleOpen = () => {
    setOpen(true);
    startCamera(facingMode);
  };

  const handleClose = React.useCallback(() => {
    stopStream();
    setCameraState('idle');
    setErrorMessage(null);
    setOpen(false);
  }, [stopStream]);

  const handleFlip = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const handleCapture = React.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      blob => {
        if (!blob) return;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `scan-${timestamp}.jpg`, {type: 'image/jpeg'});
        onCapture(file);
        handleClose();
      },
      'image/jpeg',
      0.92,
    );
  }, [onCapture, handleClose]);

  // Clean up stream when component unmounts
  React.useEffect(() => {
    return () => stopStream();
  }, [stopStream]);

  return (
    <>
      <Tooltip title="Scan document with camera">
        <Button
          variant="outlined"
          size="small"
          startIcon={<CameraAltRounded />}
          onClick={handleOpen}
        >
          Scan
        </Button>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slots={{transition: ZoomTransition}}
        slotProps={{paper: {elevation: 0}}}
      >
        <DialogTitle sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          Scan Document
          <IconButton onClick={handleClose} size="small" aria-label="Close scanner">
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{p: 1, position: 'relative'}}>
          {cameraState === 'starting' && (
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300}}>
              <CircularProgress />
            </Box>
          )}

          {cameraState === 'error' && (
            <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minHeight: 300, justifyContent: 'center'}}>
              <Typography color="error" variant="body2" textAlign="center">
                {errorMessage}
              </Typography>
              <Button onClick={() => startCamera(facingMode)}>Retry</Button>
            </Box>
          )}

          {/* Video element is always rendered so the ref is attached before the stream starts */}
          <Box
            component="video"
            ref={videoRef}
            muted
            playsInline
            sx={{
              display: cameraState === 'active' ? 'block' : 'none',
              width: '100%',
              borderRadius: 1,
              backgroundColor: 'black',
            }}
          />
          {/* Hidden canvas used for capturing frames */}
          <canvas ref={canvasRef} style={{display: 'none'}} />
        </DialogContent>

        <DialogActions sx={{justifyContent: 'space-between', px: 2}}>
          <Tooltip title="Flip camera">
            <span>
              <IconButton onClick={handleFlip} disabled={cameraState !== 'active'} aria-label="Flip camera">
                <FlipCameraIosRounded />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<CheckRounded />}
            onClick={handleCapture}
            disabled={cameraState !== 'active'}
          >
            Capture
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
