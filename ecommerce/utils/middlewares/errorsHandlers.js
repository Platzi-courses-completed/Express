const Sentry = require("@sentry/node");
const boom = require("@hapi/boom");
const debug = require("debug")("app:error");

const isRequestAjaxOrApi = require("../isRequestAjaxOrApi");

function withErrorStack(err, stack) {
  if (config.dev) {
    return { ...err, stack }; // Object.assign({}, err, stack)
  }
}

const config = require("../../config/index");

Sentry.init({
  dsn: `https://${config.sentryDns}/${config.sentryId}`,

  tracesSampleRate: 1.0,
});

function logErrors(err, req, res, next) {
  Sentry.captureException(err);
  debug(err.stack);
  next(err);
}

function wrapErrors(err, req, res, next) {
  if (!err.isBoom) {
    next(boom.badImplementation(err));
  }

  next(err);
}

function clientErrorHandler(err, req, res, next) {
  const {
    output: { statusCode, payload },
  } = err;

  // catch errors for AJAX request and errors while streaming
  if (isRequestAjaxOrApi(req) || res.headersSent) {
    res.status(statusCode).json(withErrorStack(payload, err.stack));
  } else {
    next(err);
  }
}

function errorHandler(err, req, res, next) {
  const {
    output: { statusCode, payload },
  } = err;
  res.status(statusCode);
  res.render("error", withErrorStack(payload, err.stack));
}

module.exports = {
  logErrors,
  wrapErrors,
  clientErrorHandler,
  errorHandler,
};
