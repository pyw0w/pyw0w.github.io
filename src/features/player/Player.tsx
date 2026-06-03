import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface PlayerProps {
  manifest: string;
  startAt?: number;
  onTime?: (seconds: number) => void;
  onError?: (error: string) => void;
}

export function Player({ manifest, startAt = 0, onTime, onError }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    setError(null);

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(manifest);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (data.fatal) {
          setError('Не удалось загрузить видео');
          onError?.(data.error?.message ?? 'HLS error');
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifest;
    }

    const onMeta = () => { if (startAt > 0) video.currentTime = startAt; };
    const onTimeUpdate = () => onTime?.(Math.floor(video.currentTime));
    const onVideoError = () => setError('Не удалось загрузить видео');
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('error', onVideoError);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('error', onVideoError);
      hls?.destroy();
    };
  }, [manifest, startAt, onTime, onError]);

  return error ? (
    <div className="aspect-video flex items-center justify-center bg-surface-2">
      <p className="text-sm text-text-secondary">{error}</p>
    </div>
  ) : (
    <video
      data-testid="video"
      ref={videoRef}
      controls
      playsInline
      className="w-full aspect-video bg-black"
    />
  );
}
