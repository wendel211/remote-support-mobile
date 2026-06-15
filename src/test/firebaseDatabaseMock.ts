export const mockRef = jest.fn((_database: unknown, path: string) => ({ path }));
export const mockSet = jest.fn(() => Promise.resolve());
export const mockGet = jest.fn();
export const mockUpdate = jest.fn(() => Promise.resolve());
export const mockRemove = jest.fn(() => Promise.resolve());
export const mockPush = jest.fn(() => ({ key: 'generated-id', path: 'generated-path' }));
export const mockOnValue = jest.fn();
export const mockOnDisconnectUpdate = jest.fn(() => Promise.resolve());
export const mockOnDisconnect = jest.fn(() => ({ update: mockOnDisconnectUpdate }));
export const mockServerTimestamp = jest.fn(() => 999);

export function createSnapshot(exists: boolean, value: unknown) {
  return {
    exists: () => exists,
    val: () => value,
  };
}

export function resetFirebaseDatabaseMocks() {
  mockRef.mockClear();
  mockSet.mockClear();
  mockGet.mockReset();
  mockUpdate.mockClear();
  mockRemove.mockClear();
  mockPush.mockClear();
  mockOnValue.mockReset();
  mockOnDisconnectUpdate.mockClear();
  mockOnDisconnect.mockClear();
  mockServerTimestamp.mockClear();
  mockServerTimestamp.mockReturnValue(999);
}
