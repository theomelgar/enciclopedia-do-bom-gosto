// Testes tocam Postgres real (Docker Compose), sem mock de Prisma — ver STATE.md
// §Estratégia de Testes, prioridade 1 = Dedup (Regra de Ouro).
// maxWorkers: 1 — suites compartilham o mesmo Postgres via truncateAll(); rodar em paralelo
// causa corrida entre arquivos (um trunca enquanto o outro está no meio de um teste).
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["js", "json", "ts"],
  setupFilesAfterEnv: ["<rootDir>/../test/jest.setup.ts"],
  maxWorkers: 1,
};