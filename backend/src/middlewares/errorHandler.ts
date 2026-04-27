import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

type PrismaLikeError = Error & {
  code?: string;
  meta?: { target?: unknown };
};

// Clase personalizada para errores de negocio
export class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  // Error de validación de Zod
  if (err instanceof ZodError) {
    const firstIssue = err.errors[0];
    const firstField = firstIssue?.path?.join('.') || 'campo';
    const firstMessage = firstIssue?.message || 'Dato inválido';

    return res.status(422).json({
      success: false,
      message: `${firstField}: ${firstMessage}`,
      errors: err.errors.map(e => ({ campo: e.path.join('.'), mensaje: e.message }))
    });
  }

  // Error de Prisma (ej. violación de Unique Constraint)
  const prismaError = err as PrismaLikeError;
  if (prismaError?.code === 'P2002') {
    const target = Array.isArray(prismaError.meta?.target)
      ? (prismaError.meta?.target as string[]).join(', ')
      : 'campo';
      return res.status(409).json({
        success: false,
        message: `El/Los siguiente(s) campo(s) ya existen: ${target}`,
        errors: null
      });
  }

  if (prismaError?.code === 'P2003') {
    return res.status(409).json({
      success: false,
      message: 'No se pudo completar la operación por una referencia inválida en la base de datos',
      errors: null
    });
  }

  // Error HTTP personalizado (de Services/Controllers)
  if (err instanceof HttpError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: null
    });
  }

  // Error genérico de servidor
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    errors: null
  });
}