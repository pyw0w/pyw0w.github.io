import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const attachMedia = vi.fn();
const loadSource = vi.fn();
vi.mock('hls.js', () => {
  class FakeHls {
    static isSupported() { return true; }
    static Events = { ERROR: 'hlsError' };
    attachMedia = attachMedia;
    loadSource = loadSource;
    on = vi.fn();
    destroy = vi.fn();
  }
  return { default: FakeHls };
});

import { Player } from '../src/features/player/Player';

beforeEach(() => { attachMedia.mockClear(); loadSource.mockClear(); });

describe('Player', () => {
  it('loads the manifest through hls.js when supported', () => {
    render(<Player manifest="https://x/master.m3u8" />);
    expect(screen.getByTestId('video')).toBeInTheDocument();
    expect(loadSource).toHaveBeenCalledWith('https://x/master.m3u8');
    expect(attachMedia).toHaveBeenCalled();
  });
});
