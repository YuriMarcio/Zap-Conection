export class EvolutionApiError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly statusCode: number,
    public readonly responseBody: unknown = null,
  ) {
    super(message);
    this.name = 'EvolutionApiError';
    // Mantém stack trace correto no Node
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EvolutionApiError);
    }
  }

  static fromResponse(endpoint: string, status: number, body: unknown): EvolutionApiError {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
    return new EvolutionApiError(
      `Evolution API error [${status}] on ${endpoint}: ${bodyStr}`,
      endpoint,
      status,
      body,
    );
  }
}
