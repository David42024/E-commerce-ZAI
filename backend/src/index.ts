import { config } from './config';
import app from './app';
import { ReporteProgramacionService } from './services/reporteProgramacion.service';

app.listen(config.port, () => {
  console.log(`🚀 Servidor corriendo en modo [${config.nodeEnv}] en http://localhost:${config.port}`);
  console.log(`📚 API disponible en http://localhost:${config.port}/api/v1`);
  
  // Iniciar tareas programadas
  ReporteProgramacionService.iniciarCronJobs();
});