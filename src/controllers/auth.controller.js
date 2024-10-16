const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(user);
  await emailService.sendVerificationEmail(user.email, verifyEmailToken);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailOrUsernameAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
  // res.send({ resetPasswordToken });
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
  // res.send({ verifyEmailToken });
});

const sendMentionEmail = catchAsync(async (req, res) => {
  const user = await userService.getSuppliersbyId(req.user.id);
  await emailService.sendMentionEmail(user.email, req.body.email, req.body.subject, req.body.content);
  res.send({ message: 'Mention email sent' });
});

const getMySuppliers = catchAsync(async (req, res) => {
  const user = await userService.getSuppliersbyId(req.user.id);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const createSupplier = catchAsync(async (req, res) => {
  if (req.body.chooseSurvey==='') {
    req.body.chooseSurvey = null;
  }
  // TODO: Add feedback to supplier
  req.body.feedback = [];
  if (req.body.feedback!=='') {

  }
  const user = await userService.createSupplier(req.user.id, req.body);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const updateSupplier = catchAsync(async (req, res) => {
  const user = await userService.updateSupplierById(req.user.id, req.params.supplierId, req.body);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const getMySurveys = catchAsync(async (req, res) => {
  const user = await userService.getSurveyById(req.user.id);
  const surveys = user.surveys;
  res.send(surveys);
});

const createSurvey = catchAsync(async (req, res) => {
  const user = await userService.createSurvey(req.user.id, req.body);
  const surveys = user.surveys;
  res.send(surveys);
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  sendMentionEmail,
  verifyEmail,
  getMySuppliers,
  createSupplier,
  updateSupplier,
  getMySurveys,
  createSurvey,
};
