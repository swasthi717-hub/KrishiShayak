function success(res, { data = null, message = "OK", statusCode = 200 } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function fail(res, { message = "Request failed", statusCode = 400, errors } = {}) {
  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  success,
  fail,
};
