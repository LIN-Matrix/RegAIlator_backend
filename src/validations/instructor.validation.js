const Joi = require('joi');
const { objectId } = require('./custom.validation');
const { createUser } = require('./user.validation');

const getInstructors = {
  query: Joi.object().keys({
    userId: Joi.string(),
    videoGroups: Joi.string(),
    department: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(),
  }),
};

const getInstructor = {
  params: Joi.object().keys({
    instructorId: Joi.string().custom(objectId),
  }),
};

const updateInstructor = {
  params: Joi.object().keys({
    instructorId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      videoGroups: Joi.array(),
      department: Joi.string(),
    })
    .min(1),
};

const deleteInstructor = {
  params: Joi.object().keys({
    instructorId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createInstructor: createUser,
  getInstructors,
  getInstructor,
  updateInstructor,
  deleteInstructor,
};
