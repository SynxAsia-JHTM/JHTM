import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from '@/components/ui/Modal';

function ModalFocusHarness() {
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('');

  return (
    <div>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Guest Attendance"
        description="Check in as a guest"
      >
        <label className="block text-sm font-semibold" htmlFor="guest-name">
          Your name
        </label>
        <input
          id="guest-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 px-3"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button">Cancel</button>
          <button type="button">Confirm</button>
        </div>
      </Modal>
    </div>
  );
}

afterEach(() => {
  cleanup();
});

describe('Modal focus behavior', () => {
  it('single-character entry does not move focus', async () => {
    const user = userEvent.setup();
    render(<ModalFocusHarness />);

    const name = screen.getByLabelText(/your name/i);
    const confirm = screen.getByRole('button', { name: /confirm/i });

    await user.click(name);
    await user.keyboard('O');

    expect(name).toHaveFocus();
    expect(confirm).not.toHaveFocus();
    expect(name).toHaveValue('O');
  });

  it('multi-character paste keeps focus and inserts full value', async () => {
    const user = userEvent.setup();
    render(<ModalFocusHarness />);

    const name = screen.getByLabelText(/your name/i);
    await user.click(name);
    await user.paste('Olivia Benson');

    expect(name).toHaveFocus();
    expect(name).toHaveValue('Olivia Benson');
  });

  it('Tab still changes focus as expected', async () => {
    const user = userEvent.setup();
    render(<ModalFocusHarness />);

    const name = screen.getByLabelText(/your name/i);
    const cancel = screen.getByRole('button', { name: /cancel/i });

    await user.click(name);
    await user.tab();
    expect(cancel).toHaveFocus();
  });

  it('keeps dialog semantics intact for screen-reader users', () => {
    render(<ModalFocusHarness />);
    expect(screen.getByRole('dialog', { name: /guest attendance/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toHaveAccessibleName('Your name');
  });
});
