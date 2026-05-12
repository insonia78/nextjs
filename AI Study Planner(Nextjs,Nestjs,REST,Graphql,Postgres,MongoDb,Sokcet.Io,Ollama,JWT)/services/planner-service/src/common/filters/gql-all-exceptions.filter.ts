import { Catch, HttpException, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GqlAllExceptionsFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GqlAllExceptionsFilter.name);

  catch(exception: unknown): GraphQLError {
    if (exception instanceof GraphQLError) {
      this.logger.error(`GraphQL error: ${exception.message}`, exception.stack);
      return exception;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const rawMessage = exception.getResponse();
      const message =
        typeof rawMessage === 'string'
          ? rawMessage
          : ((rawMessage as Record<string, unknown>).message as string) ??
            exception.message;

      this.logger.error(`HTTP ${status} inside GraphQL: ${message}`);
      console.log(`HTTP ${status} inside GraphQL:`, exception instanceof Error ? exception.stack : String(exception),message);
      return new GraphQLError(message, {
        extensions: {
          code: httpStatusToCode(status),
          statusCode: status,
          timestamp: new Date().toISOString(),
        },
      });
    }

    const message =
      exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(
      `Unhandled GraphQL exception: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    return new GraphQLError(message, {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
      },
    });
  }
}

function httpStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHENTICATED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
  };
  return map[status] ?? 'INTERNAL_SERVER_ERROR';
}
