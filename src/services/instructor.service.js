const httpStatus = require('http-status');
const { createUser } = require('./user.service');
const { Instructor } = require('../models');
const ApiError = require('../utils/ApiError');
const { subUserRoles } = require('../configs/roles');

/**
 * Create a instructor user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */

const createInstructor = async (userBody) => {
  const instructorBody = {
    ...userBody,
    role: subUserRoles.instructor,
  };
  return createUser(instructorBody);
};

/**
 * Query for instructors
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryInstructors = async (filter, options) => {
  return Instructor.paginate(filter, { ...options, populate: 'userId,videoGroups' });
};

/**
 * Get instructor instructor by id
 * @param {ObjectId} id
 * @returns {Promise<Instructor>}
 */
const getInstructorById = async (id) => {
  return Instructor.findById(id).populate('userId').populate('videoGroups');
};

/**
 * Update instructor by id
 * @param {ObjectId} instructorId
 * @param {Object} updateBody
 * @returns {Promise<Instructor>}
 */
const updateInstructorById = async (instructorId, updateBody) => {
  const instructor = await getInstructorById(instructorId);
  if (!instructor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Instructor not found');
  }
  Object.assign(instructor, updateBody);
  await instructor.save();
  return instructor;
};

/**
 * Delete instructor by id
 * @param {ObjectId} instructorId
 * @returns {Promise<Instructor>}
 */
const deleteInstructorById = async (instructorId) => {
  const instructor = await getInstructorById(instructorId);
  if (!instructor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Instructor not found');
  }
  await instructor.remove();
  return instructor;
};

module.exports = {
  createInstructor,
  queryInstructors,
  getInstructorById,
  updateInstructorById,
  deleteInstructorById,
};
