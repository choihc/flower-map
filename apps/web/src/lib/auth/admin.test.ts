import { describe, expect, it, vi } from 'vitest';

import { getAdminAccessState, isAdminUser } from './admin';

describe('isAdminUser', () => {
  it('returns true when the user has an admin_users row', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { user_id: 'user-1' },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(isAdminUser({ from } as never, 'user-1')).resolves.toBe(true);
    expect(from).toHaveBeenCalledWith('admin_users');
  });

  it('returns false when the user is missing from admin_users', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    await expect(isAdminUser({ from } as never, 'user-2')).resolves.toBe(false);
  });
});

describe('getAdminAccessState', () => {
  it('returns a denied state when there is no signed-in user', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    });

    await expect(
      getAdminAccessState({
        auth: { getUser },
      } as never),
    ).resolves.toEqual({
      isAdmin: false,
      user: null,
    });
  });

  it('returns the signed-in user together with the admin flag', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { user_id: 'user-3' },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-3', email: 'admin@example.com' } },
      error: null,
    });

    await expect(
      getAdminAccessState({
        auth: { getUser },
        from,
      } as never),
    ).resolves.toEqual({
      isAdmin: true,
      user: { id: 'user-3', email: 'admin@example.com' },
    });
  });
});
