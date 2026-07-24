import {config} from './shared/config';
import {buildApp} from './app';

const server = buildApp();

const start = async () => {
    try {
        await server.listen({port: config.PORT})
        console.log(`Server listening at http://localhost:${config.PORT} [${config.NODE_ENV}]`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();