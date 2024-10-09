const httpStatus = require('http-status');
const { createUser } = require('./user.service');
const { Student } = require('../models');
const ApiError = require('../utils/ApiError');
const { subUserRoles } = require('../configs/roles');

/**
 * Create a student user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */

const createStudent = async (userBody) => {
  const studentBody = {
    ...userBody,
    role: subUserRoles.student,
  };
  return createUser(studentBody);
};

/**
 * Query for students
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @param populate - for deep populate
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
const queryStudents = async (filter, options, populate) => {
  return Student.paginate(filter, {
    ...options,
    populate: `userId,students,videoGroups,instructors.${populate.deepPopulate}`,
  });
};

/**
 * Get student student by id
 * @param {ObjectId} id
 * @returns {Promise<Student>}
 */
const getStudentById = async (id) => {
  return Student.findById(id)
    .populate('userId')
    .populate('videoGroups')
    .populate({
      path: 'instructors',
      populate: { path: 'userId' },
    });
};

/**
 * Update student by id
 * @param {ObjectId} studentId
 * @param {Object} updateBody
 * @returns {Promise<Student>}
 */
const updateStudentById = async (studentId, updateBody) => {
  const student = await getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }
  Object.assign(student, updateBody);
  await student.save();
  return student;
};

/**
 * Delete student by id
 * @param {ObjectId} studentId
 * @returns {Promise<Student>}
 */
const deleteStudentById = async (studentId) => {
  const student = await getStudentById(studentId);
  if (!student) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Student not found');
  }
  await student.remove();
  return student;
};

module.exports = {
  createStudent,
  queryStudents,
  getStudentById,
  updateStudentById,
  deleteStudentById,
};
