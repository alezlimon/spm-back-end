function sendError(res, status, message, errorCode, details = []) {
  return res.status(status).json({
    message,
    errorCode,
    details: Array.isArray(details) ? details : [String(details)],
  });
}

module.exports = {
  sendError,
};