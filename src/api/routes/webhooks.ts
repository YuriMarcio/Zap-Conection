import type { FastifyInstance } from 'fastify';
import type { WebhookController } from '../controllers/WebhookController.js';

export function registerWebhookRoutes(app: FastifyInstance, controller: WebhookController): void {
  app.post('/v1/webhooks/:provider/:instanceId', controller.receive);
}
