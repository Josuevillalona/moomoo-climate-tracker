// Mock Realtime client
export const RealtimeClient = jest.fn(() => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  })),
  removeChannel: jest.fn(),
}));

export default RealtimeClient;