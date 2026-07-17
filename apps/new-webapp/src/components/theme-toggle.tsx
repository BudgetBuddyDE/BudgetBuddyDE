'use client';

import {Moon, Sun} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {useTheme} from '@/theme/theme-provider';

export function ThemeToggle() {
  const {mode, setMode} = useTheme();
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <Button variant="ghost" size="icon" aria-label={`Use ${next} theme`} onClick={() => setMode(next)}>
      {mode === 'dark' ? <Sun aria-hidden="true" className="size-4" /> : <Moon aria-hidden="true" className="size-4" />}
    </Button>
  );
}
