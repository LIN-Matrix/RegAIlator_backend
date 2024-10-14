const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { surveyService } = require('../services');

/**
 * Create a new survey
 */
const createSurvey = catchAsync(async (req, res) => {
  console.log('req.body: \n', req.body);
  const survey = await surveyService.createSurvey(req.body);
  res.status(httpStatus.CREATED).send(survey);
});

/**
 * Get a list of surveys with filtering, sorting, pagination, and deep population
 */
const getSurveys = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['id', 'ownerId']); // 可根据需求添加其他过滤条件
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const deepPopulate = pick(req.query, ['deepPopulate']);
  console.log('deepPopulate', deepPopulate);
  const result = await surveyService.querySurveys(filter, options, deepPopulate);
  console.log('result: \n', result);
  result.results.forEach((survey, index) => {
    console.log(`Survey ${index + 1}:`, JSON.stringify(survey.ownerId, null, 2));
  });
  res.send(result);
});

/**
 * Get a specific survey by id
 */
const getSurvey = catchAsync(async (req, res) => {
  const survey = await surveyService.getSurveyById(req.params.surveyId);
  if (!survey) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Survey not found');
  }
  res.send(survey);
});

/**
 * Update a survey by id
 */
const updateSurvey = catchAsync(async (req, res) => {
  const survey = await surveyService.updateSurveyById(req.params.surveyId, req.body);
  res.send(survey);
});

/**
 * Delete a survey by id
 */
const deleteSurvey = catchAsync(async (req, res) => {
  await surveyService.deleteSurveyById(req.params.surveyId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createSurvey,
  getSurveys,
  getSurvey,
  updateSurvey,
  deleteSurvey,
};
