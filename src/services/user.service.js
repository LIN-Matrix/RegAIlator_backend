const httpStatus = require('http-status');
const { User, Student, Instructor } = require('../models');
const ApiError = require('../utils/ApiError');
const { subUserRoles } = require('../configs/roles');

/**
 * Create a sub user
 * @param {Object} subUserBody
 * @returns {Promise<User>}
 */
const createSubUser = async ({ role, userId, department, instructor }) => {
  const subUserData = {
    userId,
    department,
  };
  switch (role) {
    case subUserRoles.instructor:
      return Instructor.create(subUserData);
    case subUserRoles.student:
      if (instructor) {
        subUserData.instructors = [instructor];
      }
      return Student.create(subUserData);
    default:
  }
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  let username;
  const { firstname, lastname, role, department, instructor } = userBody;

  username = firstname.toLowerCase().substring(0, 1) + lastname.toLowerCase().substring(0, 6);
  if (await User.isUserNameTaken(username)) {
    username =
      firstname.toLowerCase().substring(0, 1) + lastname.toLowerCase().substring(0, 6) + Math.floor(Math.random() * 90) + 1;
  }

  const newUser = await User.create({ ...userBody, username });
  if (newUser && role) {
    await createSubUser({ role, userId: newUser.id, department, instructor });
  }

  return newUser;
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
};
