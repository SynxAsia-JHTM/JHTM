import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ToastProvider } from '@/components/ui/ToastProvider';
import ResetPassword from '@/pages/ResetPassword';

describe('ResetPassword back navigation', () => {
  it('renders and navigates to /login when clicked', async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/reset-password']}>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    );

    const backButton = screen.getByRole('link', { name: /back to login/i });
    expect(backButton).toBeInTheDocument();

    await user.click(backButton);
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });
});
