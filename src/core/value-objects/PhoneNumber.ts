const NON_DIGITS = /\D/g;
const WHATSAPP_SUFFIXES = /@(s\.whatsapp\.net|c\.us|g\.us)$/;

/**
 * Normaliza números de WhatsApp para um formato único (apenas dígitos, sem sufixo de JID),
 * evitando que cada provider reimplemente essa limpeza (hoje duplicada como
 * `.replace('@s.whatsapp.net', '')` dentro do client da Evolution).
 */
export class PhoneNumber {
  private constructor(public readonly digits: string) {}

  static create(raw: string): PhoneNumber {
    const stripped = raw.replace(WHATSAPP_SUFFIXES, '');
    const digits = stripped.replace(NON_DIGITS, '');

    if (digits.length < 8) {
      throw new Error(`PhoneNumber inválido: "${raw}"`);
    }

    return new PhoneNumber(digits);
  }

  toJid(): string {
    return `${this.digits}@s.whatsapp.net`;
  }

  toString(): string {
    return this.digits;
  }
}
