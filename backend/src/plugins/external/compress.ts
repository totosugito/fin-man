import FastifyCompress, { type FastifyCompressOptions } from '@fastify/compress';

export const autoConfig: FastifyCompressOptions = {
  global: true, // Apply compression globally
  threshold: 1024, // Compress responses larger than 1KB
};

export default FastifyCompress;
