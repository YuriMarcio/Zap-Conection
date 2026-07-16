import { Pool } from 'pg';
import type { Instance, InstanceConnectionState } from '../../core/entities/Instance.js';
import type { WhatsAppProviderName } from '../../core/interfaces/CommunicationProvider.js';
import type { InstanceRepository } from '../../core/interfaces/InstanceRepository.js';
import type { Logger } from '../../core/interfaces/Logger.js';

export interface PostgresConfig {
  connectionString: string;
  /** Supabase e a maioria dos Postgres gerenciados exigem TLS. Default: true. */
  ssl?: boolean;
}

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

interface InstanceRow {
  id: string;
  provider: string;
  phone_number: string | null;
  state: string;
  callback_url: string | null;
  credentials: string | Record<string, string> | null;
  created_at: Date | string;
}

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_RETRY_DELAY_MS = 3_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Persistência real em Postgres (Supabase ou qualquer outro Postgres gerenciado — não usa
 * nenhuma API específica do Supabase, só a connection string padrão) — sobrevive a
 * restart/recriação do container. Guarda `credentials` como JSONB (segredo em texto plano —
 * ver aviso de segurança no README, nunca expor essa tabela publicamente). Cria a própria
 * tabela no primeiro uso (idempotente, sem framework de migration — consistente com o tamanho
 * do projeto). Trocar de backend depois exige só uma nova implementação de InstanceRepository,
 * sem tocar em Core/Providers/api/.
 */
export class PostgresInstanceRepository implements InstanceRepository {
  private readonly pool: Pool;
  private readonly ready: Promise<void>;
  private readonly maxAttempts: number;
  private readonly retryDelayMs: number;

  constructor(config: PostgresConfig, private readonly logger: Logger, retry: RetryOptions = {}) {
    this.maxAttempts = retry.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.retryDelayMs = retry.delayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.pool = new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl === false ? undefined : { rejectUnauthorized: false },
      max: 10,
    });
    this.ready = this.migrateWithRetry();
    // Evita que uma falha de conexão no boot vire "unhandled promise rejection" e derrube o
    // processo inteiro (Node trata isso como erro fatal por padrão) — o erro real continua
    // sendo propagado normalmente pra quem faz `await this.ready` em save/findById/etc.
    this.ready.catch(() => {});
  }

  /**
   * Retry na conexão inicial — cobre indisponibilidade momentânea (rede, banco ainda
   * inicializando) em vez de derrubar o processo na primeira falha.
   */
  private async migrateWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS instances (
            id TEXT PRIMARY KEY,
            provider TEXT NOT NULL,
            phone_number TEXT,
            state TEXT NOT NULL,
            callback_url TEXT,
            credentials JSONB,
            created_at TIMESTAMPTZ NOT NULL
          )
        `);
        if (attempt > 1) {
          this.logger.info(`Conectado ao Postgres na tentativa ${attempt}/${this.maxAttempts}`);
        }
        return;
      } catch (err) {
        if (attempt === this.maxAttempts) {
          this.logger.error(`Falha ao conectar no Postgres após ${this.maxAttempts} tentativas`, { error: String(err) });
          throw err;
        }
        this.logger.warn(`Postgres indisponível (tentativa ${attempt}/${this.maxAttempts}), tentando de novo em ${this.retryDelayMs}ms`, {
          error: String(err),
        });
        await delay(this.retryDelayMs);
      }
    }
  }

  async save(instance: Instance): Promise<void> {
    await this.ready;
    await this.pool.query(
      `INSERT INTO instances (id, provider, phone_number, state, callback_url, credentials, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         provider = EXCLUDED.provider,
         phone_number = EXCLUDED.phone_number,
         state = EXCLUDED.state,
         callback_url = EXCLUDED.callback_url,
         credentials = EXCLUDED.credentials`,
      [
        instance.id,
        instance.provider,
        instance.phoneNumber ?? null,
        instance.state,
        instance.callbackUrl ?? null,
        instance.credentials ? JSON.stringify(instance.credentials) : null,
        instance.createdAt,
      ],
    );
  }

  async findById(id: string): Promise<Instance | undefined> {
    await this.ready;
    const { rows } = await this.pool.query<InstanceRow>('SELECT * FROM instances WHERE id = $1 LIMIT 1', [id]);
    return rows[0] ? this.toInstance(rows[0]) : undefined;
  }

  async delete(id: string): Promise<void> {
    await this.ready;
    await this.pool.query('DELETE FROM instances WHERE id = $1', [id]);
  }

  async list(): Promise<Instance[]> {
    await this.ready;
    const { rows } = await this.pool.query<InstanceRow>('SELECT * FROM instances');
    return rows.map((row) => this.toInstance(row));
  }

  private toInstance(row: InstanceRow): Instance {
    const credentials =
      row.credentials == null
        ? undefined
        : typeof row.credentials === 'string'
          ? (JSON.parse(row.credentials) as Record<string, string>)
          : row.credentials;

    return {
      id: row.id,
      provider: row.provider as WhatsAppProviderName,
      phoneNumber: row.phone_number ?? undefined,
      state: row.state as InstanceConnectionState,
      callbackUrl: row.callback_url ?? undefined,
      credentials,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    };
  }
}
