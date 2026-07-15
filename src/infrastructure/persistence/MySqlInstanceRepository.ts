import { createPool, type Pool, type RowDataPacket } from 'mysql2/promise';
import type { Instance, InstanceConnectionState } from '../../core/entities/Instance.js';
import type { WhatsAppProviderName } from '../../core/interfaces/CommunicationProvider.js';
import type { InstanceRepository } from '../../core/interfaces/InstanceRepository.js';
import type { Logger } from '../../core/interfaces/Logger.js';

export interface MySqlConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

interface InstanceRow extends RowDataPacket {
  id: string;
  provider: string;
  phone_number: string | null;
  state: string;
  callback_url: string | null;
  credentials: string | Record<string, string> | null;
  created_at: Date | string;
}

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

const DEFAULT_MAX_ATTEMPTS = 10;
const DEFAULT_RETRY_DELAY_MS = 3_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Persistência real em MySQL — sobrevive a restart/recriação do container. Guarda `credentials`
 * como JSON (segredo em texto plano — ver aviso de segurança no README, nunca expor a porta do
 * MySQL publicamente). Cria a própria tabela no primeiro uso (idempotente, sem framework de
 * migration — consistente com o tamanho do projeto). Substituir por outro backend depois exige
 * só uma nova implementação de InstanceRepository, sem tocar em Core/Providers/api/.
 */
export class MySqlInstanceRepository implements InstanceRepository {
  private readonly pool: Pool;
  private readonly ready: Promise<void>;
  private readonly maxAttempts: number;
  private readonly retryDelayMs: number;

  constructor(config: MySqlConfig, private readonly logger: Logger, retry: RetryOptions = {}) {
    this.maxAttempts = retry.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.retryDelayMs = retry.delayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.pool = createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
    });
    this.ready = this.migrateWithRetry();
    // Evita que uma falha de conexão no boot vire "unhandled promise rejection" e derrube o
    // processo inteiro (Node trata isso como erro fatal por padrão) — o erro real continua
    // sendo propagado normalmente pra quem faz `await this.ready` em save/findById/etc.
    this.ready.catch(() => {});
  }

  /**
   * O MySQL oficial reinicia internamente na primeira inicialização (bootstrap → restart real)
   * — a porta 3306 pode ficar momentaneamente inacessível mesmo depois do healthcheck do
   * Docker já ter passado (`depends_on: condition: service_healthy` não é garantia absoluta).
   * Por isso, tenta conectar com retry em vez de falhar na primeira tentativa.
   */
  private async migrateWithRetry(): Promise<void> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS instances (
            id VARCHAR(191) PRIMARY KEY,
            provider VARCHAR(32) NOT NULL,
            phone_number VARCHAR(64) NULL,
            state VARCHAR(16) NOT NULL,
            callback_url TEXT NULL,
            credentials JSON NULL,
            created_at DATETIME NOT NULL
          )
        `);
        if (attempt > 1) {
          this.logger.info(`Conectado ao MySQL na tentativa ${attempt}/${this.maxAttempts}`);
        }
        return;
      } catch (err) {
        if (attempt === this.maxAttempts) {
          this.logger.error(`Falha ao conectar no MySQL após ${this.maxAttempts} tentativas`, { error: String(err) });
          throw err;
        }
        this.logger.warn(`MySQL indisponível (tentativa ${attempt}/${this.maxAttempts}), tentando de novo em ${this.retryDelayMs}ms`, {
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
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         provider = VALUES(provider),
         phone_number = VALUES(phone_number),
         state = VALUES(state),
         callback_url = VALUES(callback_url),
         credentials = VALUES(credentials)`,
      [
        instance.id,
        instance.provider,
        instance.phoneNumber ?? null,
        instance.state,
        instance.callbackUrl ?? null,
        instance.credentials ? JSON.stringify(instance.credentials) : null,
        this.toMySqlDateTime(instance.createdAt),
      ],
    );
  }

  async findById(id: string): Promise<Instance | undefined> {
    await this.ready;
    const [rows] = await this.pool.query<InstanceRow[]>('SELECT * FROM instances WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? this.toInstance(rows[0]) : undefined;
  }

  async delete(id: string): Promise<void> {
    await this.ready;
    await this.pool.query('DELETE FROM instances WHERE id = ?', [id]);
  }

  async list(): Promise<Instance[]> {
    await this.ready;
    const [rows] = await this.pool.query<InstanceRow[]>('SELECT * FROM instances');
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

  private toMySqlDateTime(iso: string): string {
    return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
  }
}
