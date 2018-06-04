const R = require('ramda')

class Logger {
  constructor() {
    this.config = {
      debug: (process.env.debug === 'true')
    }
    this.version = process.env.version
  }

  debug(msg, meta = {}) {
    this.log('debug', msg, meta)
  }

  info(msg, meta = {}) {
    this.log('info', msg, meta)
  }

  warn(msg, meta = {}) {
    this.log('warn', msg, meta)
  }

  error(msg, meta = {}) {
    this.log('error', msg, meta)
  }

  log(level, msg, meta = {}) {
    if (!R.contains(level, ['debug', 'info', 'warn', 'error'])) {
      throw new Error(`"${level}" is not a valid log level`);
    }

    if (level === 'debug' && !this.config.debug) {
      return
    }

    if (R.is(Error, meta)) {
      meta = {
        name: meta.name,
        errorMessage: meta.message,
        stack: meta.stack
      }
    }

    const method = level === 'debug' ? 'log' : level

    const data = R.merge({
      level,
      version: this.version,
      message: msg
    }, meta)

    /* eslint-disable no-console */
    console[method](JSON.stringify(data))
    /* eslint-disable no-console */
  }
}

module.exports = new Logger()
