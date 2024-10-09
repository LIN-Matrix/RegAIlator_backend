const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { createUser } = require('./user.validation');

const getStudents = {
  query: Joi.object().keys({
    userId: Joi.string(),
    videoGroups: Joi.string(),
    instructors: Joi.string(),
    department: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(),
    deepPopulate: Joi.string(),
  }),
};

const getStudent = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId),
  }),
};

const updateStudent = {
  params: Joi.object().keys({
    studentId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      videoGroups: Joi.array(),
      instructors: Joi.array(),
      department: Joi.string(),
    })
    .min(1),
};

const deleteStudent = {
  params: Joi.object().keys({
    studentId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createStudent: createUser,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
};
