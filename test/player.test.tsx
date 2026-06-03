import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const attachMedia = vi.fn();
const loadSource = vi.fn();
const onMock = vi.fn();
vi.mock('hls.js', () => {
  class FakeHls {
    static isSupported() { return true; }
    static Events = { ERROR: 'hlsError' };
    attachMedia = attachMedia;
    loadSource = loadSource;
    on = onMock;
    destroy = vi.fn();
  }
  return { default: FakeHls };
});

import { Player } from '../src/features/player/Player';

beforeEach(() => { attachMedia.mockClear(); loadSource.mockClear(); onMock.mockClear(); });

describe('Player', () => {
  it('loads the manifest through hls.js when supported', () => {
    render(<Player manifest="https://x/master.m3u8" />);
    expect(screen.getByTestId('video')).toBeInTheDocument();
    expect(loadSource).toHaveBeenCalledWith('https://x/master.m3u8');
    expect(attachMedia).toHaveBeenCalled();
  });

  it('shows error message on fatal HLS error', () => {
    render(<Player manifest="https://x/master.m3u8" />);
    expect(screen.getByTestId('video')).toBeInTheDocument();

    const errorCallback = onMock.mock.calls.find(c => c[0] === 'hlsError')?.[1];
    act(() => {
      errorCallback?.({}, { fatal: true, error: { message: 'network error' } });
    });

    expect(screen.queryByTestId('video')).not.toBeInTheDocument();
    expect(screen.getByText('Не удалось загрузить видео')).toBeInTheDocument();
  });
});
