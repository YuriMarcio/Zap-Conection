import { buildServer } from './buildServer.js';

async function main(): Promise<void> {
  const { app, port } = buildServer();
  await app.listen({ port, host: '0.0.0.0' });
  console.info(`[FlowBridge API] ouvindo na porta ${port}`);
}

main().catch((err) => {
  console.error('[FlowBridge API] falha ao iniciar o servidor:', err);
  process.exitCode = 1;
});
