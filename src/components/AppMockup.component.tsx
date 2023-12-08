import React from 'react';
import { Box, type BoxProps, type SxProps, type Theme } from '@mui/material';
import { Image } from './image.component';
import { useScreenSize } from '../hooks/useScreenSize.hook';

export type TAppMockupProps = {
  src?: string;
  containerProps?: BoxProps;
  imageStyle?: SxProps<Theme>;
};

export const AppMockup: React.FC<TAppMockupProps> = ({
  src = '/mockup.png',
  containerProps,
  imageStyle,
}) => {
  const screenSize = useScreenSize();
  const [rotateXDeg, setXDeg] = React.useState(10);
  const [rotateYDeg, setYDeg] = React.useState(-10);

  // FIXME: Don't use any
  function mockupMouseMove(event: any) {
    const multiplier = 25;
    const bodyWidth = document.body.offsetWidth;
    const bodyHeight = document.body.offsetHeight;

    setXDeg(-((event.pageY / bodyHeight) * 2 - 1) * multiplier);
    setYDeg(((event.pageX / bodyWidth) * 2 - 1) * multiplier);
  }

  React.useEffect(() => {
    if (screenSize !== 'small') {
      document
        .querySelector('body .mockup-container')
        ?.addEventListener('mousemove', mockupMouseMove);

      return () => {
        document
          .querySelector('body .mockup-container')
          ?.removeEventListener('mousemove', mockupMouseMove);
      };
    }
  }, []);

  return (
    <Box
      className="mockup-container"
      {...containerProps}
      sx={{
        width: '100%',
        perspective: '800px',
        ...containerProps?.sx,
      }}
    >
      <Image
        className="mockup"
        sx={{
          width: { xs: '60%', md: '20%' },
          mx: { xs: '20%', md: '40%' },
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotateXDeg}deg) rotateY(${rotateYDeg}deg)`,
          ...imageStyle,
        }}
        src={src}
        alt="mockup"
      />
    </Box>
  );
};
