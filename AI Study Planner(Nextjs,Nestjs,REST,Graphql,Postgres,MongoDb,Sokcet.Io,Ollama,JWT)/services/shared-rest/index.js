const { HttpException, HttpStatus, Logger } = require('@nestjs/common');

class AllExceptionsFilter {
  constructor() {
    this.logger = new Logger(AllExceptionsFilter.name);
  }

  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawMessage =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const error =
      typeof rawMessage === 'string'
        ? { message: rawMessage }
        : rawMessage;

    this.logger.error(
      `${request.method} ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...error,
    });
  }
}

module.exports = {
  AllExceptionsFilter,
};
