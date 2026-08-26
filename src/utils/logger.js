const env = require("../config/env");

function format(level, args) {
  const timestamp = new Date().toISOString();
  return [`[${timestamp}] [${level}]`, ...args];
}

const logger = {
  info(...args) {
    console.log(...format("INFO", args));
  },
  warn(...args) {
    console.warn(...format("WARN", args));
  },
  error(...args) {
    console.error(...format("ERROR", args));
  },
  debug(...args) {
    if (env.nodeEnv !== "production") {
      console.debug(...format("DEBUG", args));
    }
  },
};

module.exports = logger;
