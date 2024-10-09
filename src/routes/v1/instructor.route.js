const express = require('express');
const auth = require('../../middlewares/auth');
const roles = require('../../configs/roles');
const validate = require('../../middlewares/validate');
const instructorValidation = require('../../validations/instructor.validation');
const instructorController = require('../../controllers/instructor.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth(roles.accessCategories.user.instructor.manageInstructors),
    validate(instructorValidation.createInstructor),
    instructorController.createInstructor
  )
  .get(
    auth(roles.accessCategories.user.instructor.getInstructors),
    validate(instructorValidation.getInstructors),
    instructorController.getInstructors
  );

router
  .route('/:instructorId')
  .get(
    auth(roles.accessCategories.user.instructor.getInstructors),
    validate(instructorValidation.getInstructor),
    instructorController.getInstructor
  )
  .patch(
    auth(roles.accessCategories.user.instructor.manageInstructors),
    validate(instructorValidation.updateInstructor),
    instructorController.updateInstructor
  )
  .delete(
    auth(roles.accessCategories.user.instructor.manageInstructors),
    validate(instructorValidation.deleteInstructor),
    instructorController.deleteInstructor
  );

module.exports = router;
