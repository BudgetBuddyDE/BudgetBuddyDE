'use client';

import {Button, Card, CardContent, Stack, Typography} from '@mui/material';
import {alpha, useTheme} from '@mui/material/styles';
import type {ReactNode} from 'react';
import styled, {createGlobalStyle, keyframes} from 'styled-components';

const GradientPropertyStyles = createGlobalStyle`
  @property --gradient-angle {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }
`;

const rotateGradient = keyframes`
  to {
    --gradient-angle: 360deg;
  }
`;

interface GradientBorderProps {
  $duration: number;
  $gradient: string;
  $borderWidth: number;
  $borderRadius: number;
  $shadowColor: string;
}

const GradientBorder = styled.div<GradientBorderProps>`
  --gradient-angle: 0deg;

  width: min(100%, 440px);
  padding: ${({$borderWidth}) => $borderWidth}px;
  box-sizing: border-box;

  border-radius: ${({$borderRadius}) => $borderRadius}px;

  background: conic-gradient(from var(--gradient-angle), ${({$gradient}) => $gradient});

  animation: ${rotateGradient} ${({$duration}) => $duration}s linear infinite;

  box-shadow:
    0 18px 45px rgb(0 0 0 / 25%),
    0 0 35px ${({$shadowColor}) => $shadowColor};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

interface StyledCardProps {
  $backgroundColor: string;
  $textColor: string;
  $borderRadius: number;
}

const StyledCard = styled(Card)<StyledCardProps>`
  && {
    width: 100%;
    min-height: 220px;
    box-sizing: border-box;
    overflow: hidden;

    border: 0;
    border-radius: ${({$borderRadius}) => $borderRadius}px;

    /*
     * Wichtig: vollständig deckender Hintergrund.
     * Der Gradient des Wrappers scheint dadurch nur am Rand durch.
     */
    background: ${({$backgroundColor}) => $backgroundColor};
    color: ${({$textColor}) => $textColor};

    box-shadow: none;
  }
`;

const StyledCardContent = styled(CardContent)`
  && {
    min-height: 220px;
    box-sizing: border-box;
    padding: 32px;

    display: flex;
    flex-direction: column;
    justify-content: center;

    &:last-child {
      padding-bottom: 32px;
    }
  }
`;

interface SubtitleProps {
  $color: string;
}

const Subtitle = styled(Typography)<SubtitleProps>`
  && {
    margin-top: 10px;
    color: ${({$color}) => $color};
    line-height: 1.65;
  }
`;

const ActionButton = styled(Button)`
  && {
    align-self: flex-start;
    margin-top: 24px;
    padding-inline: 22px;

    border-radius: 999px;
    text-transform: none;
    font-weight: 700;
  }
`;

export interface AnimatedGradientCardProps {
  title?: ReactNode;
  children?: ReactNode;
  buttonText?: string;
  durationSeconds?: number;
  borderWidth?: number;
  gradientColors?: string[];
  onButtonClick?: () => void;
}

export function Demo({
  title = 'Animierter Verlauf',
  children = 'Die Farben des Verlaufs werden aus dem aktuellen MUI-Theme übernommen.',
  buttonText = 'Mehr erfahren',
  durationSeconds = 3,
  borderWidth = 3,
  gradientColors,
  onButtonClick,
}: AnimatedGradientCardProps) {
  const theme = useTheme();

  const defaultGradientColors = [
    theme.palette.primary.light,
    theme.palette.primary.main,
    theme.palette.primary.dark,
    theme.palette.secondary.main,
    // theme.palette.error.main,
    // theme.palette.warning.main,
    // theme.palette.success.main,
    // theme.palette.info.main,
  ];

  const selectedColors = gradientColors && gradientColors.length >= 2 ? gradientColors : defaultGradientColors;

  const gradient = [...selectedColors, selectedColors[0]].join(', ');

  const outerBorderRadius = (theme.shape.borderRadius as number) * 3;
  const innerBorderRadius = Math.max(outerBorderRadius - borderWidth, 0);

  return (
    <>
      <GradientPropertyStyles />

      <GradientBorder
        $duration={Math.max(durationSeconds, 0.1)}
        $gradient={gradient}
        $borderWidth={borderWidth}
        $borderRadius={outerBorderRadius}
        $shadowColor={alpha(theme.palette.primary.main, 0.2)}
      >
        <StyledCard
          elevation={0}
          $backgroundColor={theme.palette.background.paper}
          $textColor={theme.palette.text.primary}
          $borderRadius={innerBorderRadius}
        >
          <StyledCardContent>
            <Stack>
              <Typography component="h2" variant="h4" fontWeight={800}>
                {title}
              </Typography>

              <Subtitle variant="body1" $color={theme.palette.text.secondary}>
                {children}
              </Subtitle>

              {buttonText && (
                <ActionButton variant="contained" color="primary" onClick={onButtonClick}>
                  {buttonText}
                </ActionButton>
              )}
            </Stack>
          </StyledCardContent>
        </StyledCard>
      </GradientBorder>
    </>
  );
}
