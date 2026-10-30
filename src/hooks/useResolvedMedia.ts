import { useState, useEffect } from 'react';
import { mediaStorage } from '../services/mediaStorage';

export function useResolvedMedia(urls: string[] = []): { resolvedUrls: string[]; isLoading: boolean } {
  const [resolvedUrls, setResolvedUrls] = useState<string[]>(urls);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const hasChunkRef = urls.some(u => mediaStorage.isChunkRef(u));

    if (!hasChunkRef) {
      setResolvedUrls(urls);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all(urls.map(url => mediaStorage.resolveMedia(url)))
      .then(res => {
        if (isMounted) {
          setResolvedUrls(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResolvedUrls(urls);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [JSON.stringify(urls)]);

  return { resolvedUrls, isLoading };
}

export function useSingleResolvedMedia(url?: string): { resolvedUrl: string; isLoading: boolean } {
  const [resolvedUrl, setResolvedUrl] = useState<string>(url || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!url) {
      setResolvedUrl('');
      setIsLoading(false);
      return;
    }

    if (!mediaStorage.isChunkRef(url)) {
      setResolvedUrl(url);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    mediaStorage.resolveMedia(url)
      .then(res => {
        if (isMounted) {
          setResolvedUrl(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setResolvedUrl(url);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return { resolvedUrl, isLoading };
}
