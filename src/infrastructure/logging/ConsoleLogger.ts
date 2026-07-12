import type { LogContext, Logger } from '../../core/interfaces/Logger.js';

/**
 * Implementação padrão de Logger, usada quando nenhuma é injetada. Único ponto do SDK que
 * chama console.* — providers nunca chamam console diretamente.
 */
export class ConsoleLogger implements Logger {
  debug(message: string, context: LogContext = {}): void {
    console.debug(this.format(message, context));
  }

  info(message: string, context: LogContext = {}): void {
    console.info(this.format(message, context));
  }

  warn(message: string, context: LogContext = {}): void {
    console.warn(this.format(message, context));
  }

  error(message: string, context: LogContext = {}): void {
    console.error(this.format(message, context));
  }

  private format(message: string, context: LogContext): string {
    const { provider, instanceId, correlationId, ...rest } = context;
    const parts = [
      new Date().toISOString(),
      provider ? `provider=${provider}` : null,
      instanceId ? `instanceId=${instanceId}` : null,
      correlationId ? `correlationId=${correlationId}` : null,
    ].filter(Boolean);

    const extra = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : '';
    return `[${parts.join(' ')}] ${message}${extra}`;
  }
}
