export class RpcError extends Error {
  constructor(
    message: string,
    readonly code = 'rpc_error',
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RpcError';
  }
}

export class RpcAuthError extends RpcError {
  constructor(cause?: unknown) {
    super('RPC secret rejected', 'rpc_auth', cause);
    this.name = 'RpcAuthError';
  }
}

export class RpcTimeoutError extends RpcError {
  constructor(timeoutMs: number, cause?: unknown) {
    super(`RPC request timed out after ${timeoutMs}ms`, 'rpc_timeout', cause);
    this.name = 'RpcTimeoutError';
  }
}

export class RpcConnectionError extends RpcError {
  constructor(cause?: unknown) {
    super('Motrix RPC is unreachable', 'rpc_unreachable', cause);
    this.name = 'RpcConnectionError';
  }
}

export class RpcInvalidResponseError extends RpcError {
  constructor(cause?: unknown) {
    super('Motrix returned an invalid RPC response', 'rpc_invalid_response', cause);
    this.name = 'RpcInvalidResponseError';
  }
}
