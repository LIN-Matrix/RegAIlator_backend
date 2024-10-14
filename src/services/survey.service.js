const httpStatus = require('http-status');
const { Survey } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a survey
 * @param {Object} surveyBody
 * @returns {Promise<Survey>}
 */
const createSurvey = async (surveyBody) => {
  return Survey.create(surveyBody);
};

/**
 * Query for surveys
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param populate - for deep populate
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const querySurveys = async (filter, options, populate) => {
  return Survey.paginate(filter, {
    ...options,
    populate: `ownerId,suppliers.${populate.deepPopulate}`,
  });
};

/**
 * Get survey by id
 * @param {ObjectId} id
 * @returns {Promise<Survey>}
 */
const getSurveyById = async (id) => {
  return Survey.findById(id)
    .populate('ownerId')
    .populate('suppliers');
};

/**
 * Update survey by id
 * @param {ObjectId} surveyId
 * @param {Object} updateBody
 * @returns {Promise<Survey>}
 */
const updateSurveyById = async (surveyId, updateBody) => {
  const survey = await getSurveyById(surveyId);
  if (!survey) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Survey not found');
  }
  Object.assign(survey, updateBody);
  await survey.save();
  return survey;
};

/**
 * Delete survey by id
 * @param {ObjectId} surveyId
 * @returns {Promise<Survey>}
 */
const deleteSurveyById = async (surveyId) => {
  const survey = await getSurveyById(surveyId);
  if (!survey) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Survey not found');
  }
  await survey.remove();
  return survey;
};

module.exports = {
  createSurvey,
  querySurveys,
  getSurveyById,
  updateSurveyById,
  deleteSurveyById,
};
