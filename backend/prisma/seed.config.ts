// Конфигурация для Prisma seed
export default {
  seed: async () => {
    const { default: seed } = await import('./seed');
    return seed;
  },
};

