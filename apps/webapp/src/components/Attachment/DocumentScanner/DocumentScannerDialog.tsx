'use client';

import {CameraAltRounded, CropFreeRounded, RefreshRounded} from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import React from 'react';
import Webcam from 'react-webcam';
import {CloseIconButton} from '@/components/Button';
import {applyPerspectiveTransform, estimateOutputDimensions, type Point} from '@/utils/perspectiveTransform';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'camera' | 'crop' | 'preview';
type Corners = [Point, Point, Point, Point]; // TL, TR, BR, BL

export type DocumentScannerDialogProps = {
  open: boolean;
  /** Called with the scanned File when the user confirms the scan. */
  onCapture: (file: File) => void;
  onClose: () => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VIDEO_CONSTRAINTS: MediaTrackConstraints = {
  width: 1280,
  height: 720,
  // Prefer the rear camera on mobile devices for better document photos.
  // Falls back to the front camera if "environment" is unavailable.
  facingMode: 'environment',
};

/** Minimum hit-target radius (in canvas pixels) for corner handles. */
const HANDLE_HIT_RADIUS = 30;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * A three-phase document scanner dialog:
 *  1. **camera** – live webcam preview; user taps "Capture".
 *  2. **crop**   – captured frame with four draggable corner handles for
 *                  perspective-correction boundary selection.
 *  3. **preview**– the corrected & enhanced document ready to upload.
 *
 * Uses only browser-native APIs + the free `react-webcam` library.
 * No commercial SDK required.
 */
export const DocumentScannerDialog: React.FC<DocumentScannerDialogProps> = ({open, onCapture, onClose}) => {
  const [phase, setPhase] = React.useState<Phase>('camera');
  const [scannedSrc, setScannedSrc] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);

  const webcamRef = React.useRef<Webcam>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const cornersRef = React.useRef<Corners>([
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
  ]);
  const activeHandleRef = React.useRef<number>(-1);

  const setCorners = (next: Corners) => {
    cornersRef.current = next;
  };

  // Reset all state when the dialog closes.
  React.useEffect(() => {
    if (!open) {
      setPhase('camera');
      setScannedSrc(null);
      setIsProcessing(false);
      setCameraError(null);
      imageRef.current = null;
    }
  }, [open]);

  // ── Phase 1: capture ────────────────────────────────────────────────────────

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      // Default corners use a 5 % inset from each edge so all handles are
      // clearly visible and the user can immediately see where to drag them.
      const insetX = img.width * 0.05;
      const insetY = img.height * 0.05;
      const defaultCorners: Corners = [
        [insetX, insetY],
        [img.width - insetX, insetY],
        [img.width - insetX, img.height - insetY],
        [insetX, img.height - insetY],
      ];
      setCorners(defaultCorners);

      // Set canvas size before entering the crop phase.
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      setPhase('crop');
    };
    img.src = imageSrc;
  };

  // ── Phase 2: corner editing (canvas drawing) ─────────────────────────────────

  const drawCropCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    const c = cornersRef.current;

    // Translucent selection polygon
    ctx.beginPath();
    ctx.moveTo(c[0][0], c[0][1]);
    ctx.lineTo(c[1][0], c[1][1]);
    ctx.lineTo(c[2][0], c[2][1]);
    ctx.lineTo(c[3][0], c[3][1]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(25, 118, 210, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(25, 118, 210, 0.85)';
    ctx.lineWidth = Math.max(2, canvas.width / 400);
    ctx.stroke();

    // Corner handles
    const r = Math.max(14, canvas.width / 55);
    for (const [cx, cy] of c) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1976d2';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, []);

  React.useEffect(() => {
    if (phase === 'crop') drawCropCanvas();
  }, [phase, drawCropCanvas]);

  // Pointer helpers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) * canvas.width) / rect.width,
      ((e.clientY - rect.top) * canvas.height) / rect.height,
    ];
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [px, py] = getCanvasPoint(e);
    const idx = cornersRef.current.findIndex(([cx, cy]) => Math.hypot(cx - px, cy - py) < HANDLE_HIT_RADIUS);
    activeHandleRef.current = idx;
    if (idx >= 0) (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeHandleRef.current < 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const [px, py] = getCanvasPoint(e);
    const clamped: Point = [Math.max(0, Math.min(canvas.width, px)), Math.max(0, Math.min(canvas.height, py))];
    const next = [...cornersRef.current] as Corners;
    next[activeHandleRef.current] = clamped;
    setCorners(next);
    drawCropCanvas();
  };

  const handlePointerUp = () => {
    activeHandleRef.current = -1;
  };

  // ── Phase 2 → Phase 3: apply perspective transform ───────────────────────────

  const handleScan = () => {
    const img = imageRef.current;
    if (!img) return;

    setIsProcessing(true);

    // Run the heavy pixel loop asynchronously so React can render the spinner.
    setTimeout(() => {
      try {
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        const ctx = srcCanvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);

        const {width, height} = estimateOutputDimensions(cornersRef.current);
        const corrected = applyPerspectiveTransform(srcCanvas, cornersRef.current, width, height);

        // Apply contrast + brightness enhancement via canvas filter.
        const enhanced = document.createElement('canvas');
        enhanced.width = corrected.width;
        enhanced.height = corrected.height;
        const enhCtx = enhanced.getContext('2d');
        if (!enhCtx) return;
        enhCtx.filter = 'contrast(1.3) brightness(1.05)';
        enhCtx.drawImage(corrected, 0, 0);

        setScannedSrc(enhanced.toDataURL('image/jpeg', 0.92));
        setPhase('preview');
      } finally {
        setIsProcessing(false);
      }
    }, 0);
  };

  // ── Phase 3: use the scan ─────────────────────────────────────────────────────

  const handleUseScan = async () => {
    if (!scannedSrc) return;
    const response = await fetch(scannedSrc);
    const blob = await response.blob();
    const file = new File([blob], `scan_${Date.now()}.jpg`, {type: 'image/jpeg'});
    onCapture(file);
  };

  // ── Title per phase ───────────────────────────────────────────────────────────

  const title = phase === 'camera' ? 'Scan Document' : phase === 'crop' ? 'Adjust Corners' : 'Scan Preview';

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{paper: {elevation: 0}}}
      data-testid="document-scanner-dialog"
    >
      <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        {title}
        <CloseIconButton onClick={onClose} />
      </DialogTitle>

      <DialogContent sx={{p: 2, pt: 0}}>
        {/* ── Camera ─────────────────────────────────────────────────────────── */}
        {phase === 'camera' && (
          <Box>
            {cameraError ? (
              <Stack alignItems="center" gap={1} p={3}>
                <CameraAltRounded sx={{fontSize: 48, color: 'text.secondary'}} />
                <Typography variant="body2" color="error" textAlign="center">
                  {cameraError}
                </Typography>
              </Stack>
            ) : (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={VIDEO_CONSTRAINTS}
                onUserMediaError={() =>
                  setCameraError('Camera access denied. Please allow camera access in your browser settings.')
                }
                style={{width: '100%', borderRadius: 4, display: 'block'}}
                data-testid="webcam-preview"
              />
            )}
          </Box>
        )}

        {/* ── Corner editing ─────────────────────────────────────────────────── */}
        {phase === 'crop' && (
          <Box>
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                touchAction: 'none',
                cursor: 'crosshair',
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              data-testid="crop-canvas"
            />
            <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
              Drag the blue handles to align with your document edges.
            </Typography>
          </Box>
        )}

        {/* ── Scan preview ──────────────────────────────────────────────────── */}
        {phase === 'preview' && scannedSrc && (
          <Box
            component="img"
            src={scannedSrc}
            alt="Scanned document preview"
            sx={{width: '100%', height: 'auto', display: 'block', borderRadius: 1}}
            data-testid="scan-preview-image"
          />
        )}

        {/* ── Processing overlay ────────────────────────────────────────────── */}
        {isProcessing && (
          <Stack alignItems="center" gap={1} py={2}>
            <CircularProgress size={32} />
            <Typography variant="caption" color="text.secondary">
              Applying perspective correction…
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{px: 2, pb: 2}}>
        {phase === 'camera' && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              startIcon={<CameraAltRounded />}
              onClick={handleCapture}
              disabled={!!cameraError}
              data-testid="capture-button"
            >
              Capture
            </Button>
          </>
        )}

        {phase === 'crop' && (
          <>
            <Button startIcon={<RefreshRounded />} onClick={() => setPhase('camera')}>
              Retake
            </Button>
            <Button
              variant="contained"
              startIcon={<CropFreeRounded />}
              onClick={handleScan}
              disabled={isProcessing}
              data-testid="scan-button"
            >
              {isProcessing ? 'Processing…' : 'Scan'}
            </Button>
          </>
        )}

        {phase === 'preview' && (
          <>
            <Button onClick={() => setPhase('crop')}>Adjust</Button>
            <Button startIcon={<RefreshRounded />} onClick={() => setPhase('camera')}>
              Retake
            </Button>
            <Button variant="contained" onClick={handleUseScan} data-testid="use-scan-button">
              Use This Scan
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
