import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface PlayerProps {
  manifest: string;
  startAt?: number;
  onTime?: (seconds: number) => void;
}

export function Player({ manifest, startAt = 0, onTime }: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(manifest);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = manifest;
    }

    const onMeta = () => { if (startAt > 0) video.currentTime = startAt; };
    const onTimeUpdate = () => onTime?.(Math.floor(video.currentTime));
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('timeupdate', onTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('timeupdate', onTimeUpdate);
      hls?.destroy();
    };
  }, [manifest, startAt, onTime]);

  return <video data-testid="video" ref={videoRef} controls playsInline style={{ width: '100%' }} />;
}
