/**
 * Prisma client singleton.
 *
 * In long-running Node processes we should keep a single PrismaClient instance.
 */

import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();


