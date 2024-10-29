const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const path = require('path');

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
  const survey = await user.surveys.id(req.body.survey._id);
  const attachments = survey.attachments.map(attachment => ({
    filename: attachment.filename,
    size: attachment.size,
    contentType: attachment.contentType,
    path: path.join(__dirname, '../..', attachment.content.replace('/api/uploads/', 'uploads/')),
  }));
  await emailService.sendMentionEmail(user.email, req.body.email, survey.title, survey.content, attachments, user.email);
  res.send({ message: 'Mention email sent' });
});

const getMySuppliers = catchAsync(async (req, res) => {
  const user = await userService.getSuppliersbyId(req.user.id);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const createSupplier = catchAsync(async (req, res) => {
  const user = await userService.createSupplier(req.user.id, req.body);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const createSupplierBatch = catchAsync(async (req, res) => {
  const user = await userService.createSupplierBatch(req.user.id, req.body);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const updateSupplier = catchAsync(async (req, res) => {
  const user = await userService.updateSupplierById(req.user.id, req.params.supplierId, req.body);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const updateSuppliers = catchAsync(async (req, res) => {
  const user = await userService.updateSuppliersByIds(req.user.id, req.body);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const deleteSuppliers = catchAsync(async (req, res) => {
  const user = await userService.deleteSuppliersById(req.user.id, req.body.supplierIds);
  const suppliers = user.suppliers;
  res.send(suppliers);
});

const getMySurveys = catchAsync(async (req, res) => {
  const user = await userService.getSurveyById(req.user.id);
  const surveys = user.surveys;
  res.send(surveys);
});

const createSurvey = async (req, res) => {
  const surveyData = {
    ...req.body,
    attachments: [], // 初始化附件数组
  };

  // 处理上传的文件
  if (req.files) {
    surveyData.attachments = req.files.map(file => ({
      content: `/api/uploads/${file.filename}`, // 根据您的存储方式调整
      filename: file.originalname,
      size: file.size,
      contentType: file.mimetype,
    }));
  }

  const user = await userService.createSurvey(req.user.id, surveyData);
  const surveys = user.surveys;
  res.send(surveys);
}

const updateSurveyAttachments = catchAsync(async (req, res) => {
  const surveyData = {
    add_attachments: [], // 初始化附件数组
  };
  // 处理上传的文件
  if (req.files) {
    surveyData.add_attachments = req.files.map(file => ({
      content: `/api/uploads/${file.filename}`, // 根据您的存储方式调整
      filename: file.originalname,
      size: file.size,
      contentType: file.mimetype,
    }));
  }
  const user = await userService.updateSurveyById(req.user.id, req.params.surveyId, surveyData);
  const surveys = user.surveys;
  res.send(surveys);
});

const updateSurvey = catchAsync(async (req, res) => {
  const user = await userService.updateSurveyById(req.user.id, req.params.surveyId, req.body);
  const surveys = user.surveys;
  res.send(surveys);
});

const deleteSurveys = catchAsync(async (req, res) => {
  const user = await userService.deleteSurveysById(req.user.id, req.body.surveyIds);
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
  updateSuppliers,
  deleteSuppliers,
  getMySurveys,
  createSurvey,
  updateSurvey,
  deleteSurveys,
  createSupplierBatch,
  updateSurveyAttachments,
};
