import {AppConfig} from '@/app.config';

import {useIsomorphicEffect} from '../useIsomorphicEffect';

/**
 * Custom hook to update the document title.
 *
 * @param title - The new title for the document.
 * @example
 * function Demo() {
 *   const [title, setTitle] = useState('');
 *   useDocumentTitle(title);
 *
 *   return (
 *     <Button onClick={() => setTitle(randomId())}>
 *       Set document title to random id
 *     </Button>
 *   );
 * }
 * @author https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-document-title/use-document-title.ts
 */
export function useDocumentTitle(title: string, clearOnUnmount = false) {
  useIsomorphicEffect(() => {
    if (typeof title === 'string' && title.trim().length > 0) {
      document.title = title.trim();
    }

    return () => {
      if (clearOnUnmount) document.title = AppConfig.appName;
    };
  }, [title]);
}
