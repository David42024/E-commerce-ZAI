import { ClienteRepository } from './src/repositories/cliente.repo';

async function main() {
  const repo = new ClienteRepository();
  try {
    // Buscamos un usuario que sepamos que existe o uno al azar
    // Para reproducir el error, cualquier usuario debería fallar si el esquema está mal
    console.log('Intentando llamar a findPerfilByUserId...');
    const res = await repo.findPerfilByUserId('some-uuid-or-empty');
    console.log('Resultado:', res);
  } catch (err) {
    console.error('ERROR DETECTADO:', err);
  }
}

main();
