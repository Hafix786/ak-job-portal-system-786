import fastify from 'fastify';

export function buildApp() {
  const app = fastify({logger: false});
  
  app.get('/', async () => {
    return {status: 'ok', message: 'Skeleton is fully operational!'};
  });

  return app;
}

