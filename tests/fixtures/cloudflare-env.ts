// Unit-only module target. Tests supply variables through vi.mock; all platform
// behavior (storage, sockets, hibernation, alarms) runs in workerd instead.
export const env = {};
