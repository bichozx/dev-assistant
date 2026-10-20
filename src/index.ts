// import { DOCUMENTATION_ASSISTANT_PROMPT } from './llm/propmts.js';
// import { askClaude } from './llm/anthropic-client.js';
// import { streamClaude } from './llm/streaming.js';
import { startCLI } from './chat/cli.js';

//Codigo para pruebas systemCloude de la API de Claude
// const CODIGO_CON_PROBLEMAS = `
// async function getUser(id) {
//   const query = "SELECT * FROM users WHERE id = " + id;
//   const result = await db.query(query);
//   return result[0];
// }
// function calcularDescuento(precio, tipo) {
//   if (tipo == "vip") {
//     return precio * 0.8;
//   } else if (tipo == "regular") {
//     return precio * 0.9;
//   } else {
//     return precio;
//   }
// }
// `;

//Codigo para pruebas streamCloude de la API de Claude
// const QUESTION = `¿Ques async/await en javaScript?`;

// async function main(): Promise<void> {
//   console.log('╔════════════════════════════════════════╗');
//   console.log('║        DevAssistant - Curso IA         ║');
//   console.log('╚════════════════════════════════════════╝');
//   console.log('');
//   console.log('Demo 1: Sin streaming (askCloude)');
//   console.log('');
//   const answer = await askClaude(QUESTION, DOCUMENTATION_ASSISTANT_PROMPT);
//   console.log('_'.repeat(50));
//   console.log(answer);
//   console.log('_'.repeat(50));
//   console.log('');
//   await new Promise((resolve) => setTimeout(resolve, 1500));
//   console.log('');
//   console.log('Demo 2: Con streaming (streamCloude)');
//   console.log('');
//   await streamClaude(QUESTION, DOCUMENTATION_ASSISTANT_PROMPT);
//   console.log('_'.repeat(50));
//   console.log('');

//   console.log('🚀 Próximo paso: Sección 3 — Primera llamada a Claude API');
// }

// main().catch((error: Error) => console.error('Error:', error.message));

startCLI().catch((error: Error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
