export const MESSAGE_TYPES = {
  // Client → Server
  CONNECT: 'connect',
  ACTION_RESULT: 'action_result',
  EVENT: 'event',
  // Server → Client
  COMMAND: 'command',
  MESSAGE: 'message',
  SCENARIO: 'scenario',
} as const
