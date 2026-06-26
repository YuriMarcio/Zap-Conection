// ============================================================================
// ThrottledSender
//
// Envolve qualquer função de envio adicionando delay aleatório entre disparos.
// Essencial para instâncias Baileys em prospecção — rajadas causam ban.
//
// Uso:
//   const sender = new ThrottledSender({ minMs: 8_000, maxMs: 15_000 });
//
//   await sender.batch(numbers, async (number) => {
//     return client.sendText('prospeccao-01', number, mensagem);
//   }, {
//     onSent:  (n, res, i, total) => console.log(`[${i}/${total}] → ${n}`),
//     onError: (n, err, i)       => console.error(`[${i}] ERRO → ${n}: ${err.message}`),
//   });
// ============================================================================

export interface ThrottledSenderOptions {
  /** Delay mínimo em ms entre disparos. Default: 8000 */
  minMs?: number;
  /** Delay máximo em ms entre disparos. Default: 15000 */
  maxMs?: number;
}

export interface BatchResult<T> {
  item: T;
  response: unknown;
  error: string | null;
}

export interface BatchCallbacks<T> {
  onSent?: (item: T, response: unknown, index: number, total: number) => void;
  onError?: (item: T, error: Error, index: number) => void;
}

export class ThrottledSender {
  private readonly minMs: number;
  private readonly maxMs: number;

  constructor(options: ThrottledSenderOptions = {}) {
    this.minMs = options.minMs ?? 8_000;
    this.maxMs = options.maxMs ?? 15_000;

    if (this.minMs > this.maxMs) {
      throw new Error(`ThrottledSender: minMs (${this.minMs}) não pode ser maior que maxMs (${this.maxMs})`);
    }
  }

  // --------------------------------------------------------------------------
  // Delay interno
  // --------------------------------------------------------------------------

  private delay(): Promise<void> {
    const ms = Math.floor(Math.random() * (this.maxMs - this.minMs + 1)) + this.minMs;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --------------------------------------------------------------------------
  // batch — processa lista com delay entre cada item
  // --------------------------------------------------------------------------

  async batch<T>(
    items: T[],
    callback: (item: T) => Promise<unknown>,
    callbacks: BatchCallbacks<T> = {},
  ): Promise<BatchResult<T>[]> {
    const { onSent, onError } = callbacks;
    const results: BatchResult<T>[] = [];
    const total = items.length;

    for (let i = 0; i < total; i++) {
      const item = items[i]!;

      // delay entre disparos (não antes do primeiro)
      if (i > 0) await this.delay();

      try {
        const response = await callback(item);
        results.push({ item, response, error: null });
        onSent?.(item, response, i + 1, total);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        results.push({ item, response: null, error: error.message });
        onError?.(item, error, i + 1);
      }
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Estimativa de tempo antes de rodar
  // --------------------------------------------------------------------------

  estimateSeconds(count: number): { minSeconds: number; maxSeconds: number } {
    const intervals = Math.max(0, count - 1);
    return {
      minSeconds: (intervals * this.minMs) / 1000,
      maxSeconds: (intervals * this.maxMs) / 1000,
    };
  }
}
