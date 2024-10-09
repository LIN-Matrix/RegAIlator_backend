const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { instructorService } = require('../services');

const createInstructor = catchAsync(async (req, res) => {
  const user = await instructorService.createInstructor(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getInstructors = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['userId', 'department']);
  const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);
  const result = await instructorService.queryInstructors(filter, options);
  res.send(result);
});

const getInstructor = catchAsync(async (req, res) => {
  const user = await instructorService.getInstructorById(req.params.instructorId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Instructor not found');
  }
  res.send(user);
});

const updateInstructor = catchAsync(async (req, res) => {
  const user = await instructorService.updateInstructorById(req.params.instructorId, req.body);
  res.send(user);
});

const deleteInstructor = catchAsync(async (req, res) => {
  await instructorService.deleteInstructorById(req.params.instructorId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createInstructor,
  updateInstructor,
  deleteInstructor,
  getInstructors,
  getInstructor,
};
