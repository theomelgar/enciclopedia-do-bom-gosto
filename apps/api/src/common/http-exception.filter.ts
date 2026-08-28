import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ZodError } from "zod";

// API_SPEC.md §Convenções: erros no formato RFC 7807 (application/problem+json).
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ url: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = "Internal Server Error";
    let detail: string | undefined;

    if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      title = "Validation Error";
      detail = exception.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      title = exception.name;
      const response = exception.getResponse();
      detail = typeof response === "string" ? response : (response as any).message;
    } else if (exception instanceof Error) {
      detail = exception.message;
    }

    res.status(status).contentType("application/problem+json").json({
      type: "about:blank",
      title,
      status,
      detail,
      instance: req.url,
    });
  }
}
