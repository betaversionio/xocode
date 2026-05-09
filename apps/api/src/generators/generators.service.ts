import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@xo/database";
import type { RegisterGeneratorInput, PaginationInput } from "@xo/shared";

@Injectable()
export class GeneratorsService {
  async findAll(query: PaginationInput) {
    const { page, limit, search, order } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? { OR: [{ name: { contains: search } }, { description: { contains: search } }] }
      : undefined;

    const [data, total] = await prisma.$transaction([
      prisma.generator.findMany({ where, skip, take: limit, orderBy: { createdAt: order }, include: { author: { select: { id: true, name: true, githubUrl: true } } } }),
      prisma.generator.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(name: string) {
    const generator = await prisma.generator.findUnique({
      where: { name },
      include: { author: { select: { id: true, name: true, githubUrl: true } } },
    });
    if (!generator) throw new NotFoundException(`Generator "${name}" not found`);
    return generator;
  }

  async register(dto: RegisterGeneratorInput, authorId: string) {
    return prisma.generator.create({
      data: { ...dto, authorId },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async incrementDownloads(name: string) {
    return prisma.generator.update({
      where: { name },
      data: { downloads: { increment: 1 } },
    });
  }
}
