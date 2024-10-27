const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const { subUserRoles } = require('../configs/roles');

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  return User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  return User.paginate(filter, options);
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get suppliers by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getSuppliersbyId = async (id) => {
  return User.findById(id).populate('suppliers');
}

const createSupplier = async (id, supplierBody) => {
  const user = await User.findById(id);
  user.suppliers.push(supplierBody);
  await user.save();
  return user;
}

// TODO: Update supplier by id
const updateSupplierById = async (id, supplierId, supplierBody) => {
  const chooseSurvey = supplierBody.chooseSurvey;
  const user = await User.findById(id);
  const supplier = user.suppliers.id(supplierId);
  supplier.chooseSurvey = chooseSurvey;
  await user.save();
  console.log(supplier);
  return user;
}

const deleteSuppliersById = async (id, supplierIds) => {
  const user = await User.findById(id);
  supplierIds.forEach(supplierId => {
    user.suppliers.id(supplierId).remove();
  });
  await user.save();
  return user;
}

/**
 * 
 */
const getSurveyById = async (id) => {
  return User.findById(id).populate('surveys');
}

const createSurvey = async (id, surveyBody) => {  
  const user = await User.findById(id);
  user.surveys.push(surveyBody);
  await user.save();
  return user;
}

const updateSurveyById = async (id, surveyId, surveyBody) => {
  const user = await User.findById(id);
  const survey = user.surveys.id(surveyId);
  survey = surveyBody;
  await user.save();
  return user;
}

const deleteSurveysById = async (id, surveyIds) => {
  const user = await User.findById(id);
  surveyIds.forEach(surveyId => {
    user.surveys.id(surveyId).remove();
  });
  await user.save();
  return user;
}

/**
 * Get user by email / username
 * @param {string} value
 * @returns {Promise<User>}
 */
const getUserByEmailOrUsername = async (value) => {
  return User.findOne({ $or: [{ email: value }, { username: value }] });
  // return User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmailOrUsername,
  updateUserById,
  deleteUserById,
  getSuppliersbyId,
  updateSupplierById,
  deleteSuppliersById,
  createSupplier,
  getSurveyById,
  updateSurveyById,
  deleteSurveysById,
  createSurvey,
};
