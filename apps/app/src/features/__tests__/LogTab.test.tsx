import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LogTab } from '@/features/log/LogTab';
import { useStore } from '@/store/useStore';
import { DEFAULT_STATE } from '@/lib/schema';

function resetStore() {
  useStore.setState({
    ...DEFAULT_STATE,
    selectedZone: null,
    hydrated: true,
    migrationNotice: null,
  });
}

beforeEach(() => {
  resetStore();
});

describe('LogTab', () => {
  it('disables the log button until a zone is chosen', async () => {
    render(<LogTab onLogged={vi.fn()} />);
    const button = screen.getByRole('button', { name: /select a zone to log/i });
    expect(button).toBeDisabled();
  });

  it('logs an injection for the selected zone and region', async () => {
    const user = userEvent.setup();
    const onLogged = vi.fn();
    render(<LogTab onLogged={onLogged} />);

    await user.click(screen.getByRole('button', { name: /^zone 5,/i }));
    await user.click(screen.getByRole('button', { name: /log abdomen l, zone 5/i }));

    const logs = useStore.getState().logs;
    expect(logs).toHaveLength(1);
    expect(logs[0]?.zone).toBe(4);
    expect(logs[0]?.region).toBe('abdomen-L');
    expect(onLogged).toHaveBeenCalledWith('Logged Abdomen L, zone 5');
  });

  it('clears the selection after logging, so a double tap cannot double-log', async () => {
    const user = userEvent.setup();
    render(<LogTab onLogged={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^zone 3,/i }));
    await user.click(screen.getByRole('button', { name: /log abdomen l, zone 3/i }));

    expect(useStore.getState().selectedZone).toBeNull();
    expect(screen.getByRole('button', { name: /select a zone to log/i })).toBeDisabled();
  });

  it('logs without interruption when the zone is not a repeat', async () => {
    const user = userEvent.setup();
    render(<LogTab onLogged={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^zone 2,/i }));
    await user.click(screen.getByRole('button', { name: /log abdomen l, zone 2/i }));

    // No modal should have appeared for a first-time site.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(useStore.getState().logs).toHaveLength(1);
  });

  it('warns before logging a recently used zone, and can be cancelled', async () => {
    const user = userEvent.setup();
    useStore.setState({
      logs: [
        {
          id: 'prev',
          region: 'abdomen-L',
          zone: 4,
          timestamp: new Date().toISOString(),
        },
      ],
    });
    render(<LogTab onLogged={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^zone 5,/i }));
    await user.click(screen.getByRole('button', { name: /log abdomen l, zone 5/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /pick another/i }));
    // Cancelling must not write anything.
    expect(useStore.getState().logs).toHaveLength(1);
  });

  it('logs anyway when the user confirms the warning', async () => {
    const user = userEvent.setup();
    useStore.setState({
      logs: [
        { id: 'prev', region: 'abdomen-L', zone: 4, timestamp: new Date().toISOString() },
      ],
    });
    render(<LogTab onLogged={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^zone 5,/i }));
    await user.click(screen.getByRole('button', { name: /log abdomen l, zone 5/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /log anyway/i }));

    expect(useStore.getState().logs).toHaveLength(2);
  });

  it('never tells the user the app prevents lipohypertrophy', async () => {
    const user = userEvent.setup();
    useStore.setState({
      logs: [
        { id: 'p1', region: 'abdomen-L', zone: 4, timestamp: new Date().toISOString() },
        { id: 'p2', region: 'abdomen-L', zone: 4, timestamp: new Date().toISOString() },
      ],
    });
    render(<LogTab onLogged={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^zone 5,/i }));
    await user.click(screen.getByRole('button', { name: /log abdomen l, zone 5/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent ?? '').not.toMatch(
      /\b(ensures?|prevents?|guarantees?)\b/i,
    );
  });

  it('switching region clears the pending zone selection', async () => {
    const user = userEvent.setup();
    render(<LogTab onLogged={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^zone 6,/i }));
    expect(useStore.getState().selectedZone).toBe(5);

    await user.click(screen.getByRole('button', { name: 'Thigh R' }));
    // A zone number means a different physical location on a different
    // region, so carrying the selection over would be wrong.
    expect(useStore.getState().selectedZone).toBeNull();
  });

  it('moves between zones with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<LogTab onLogged={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^zone 1,/i }));
    await user.keyboard('{ArrowRight}');
    expect(useStore.getState().selectedZone).toBe(1);

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    // Wraps around the dial rather than stopping at the end.
    expect(useStore.getState().selectedZone).toBe(11);
  });

  it('announces zone state to assistive technology', async () => {
    const user = userEvent.setup();
    render(<LogTab onLogged={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^zone 1,/i }));
    await user.click(screen.getByRole('button', { name: /log abdomen l, zone 1/i }));

    expect(screen.getByRole('button', { name: /zone 1,.*used 1 time/i })).toBeInTheDocument();
  });
});
