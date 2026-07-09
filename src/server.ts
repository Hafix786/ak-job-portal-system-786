import {buildApp} from './app';

const server = buildApp();
const PORT = 3000

const start = async () => {
    try {
        await server.listen({port: PORT})
        console.log(`Server listening at http://localhost:${PORT}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}

start();