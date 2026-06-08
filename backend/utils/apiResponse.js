const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = { success, message };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

module.exports = sendResponse;

// Usage →
// sendResponse(res, 200, true, "Login successful", { user, token })
// sendResponse(res, 400, false, "Invalid credentials")