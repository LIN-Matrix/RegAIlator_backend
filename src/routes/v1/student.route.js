const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const studentValidation = require('../../validations/student.validation');
const studentController = require('../../controllers/student.controller');
const roles = require('../../configs/roles');

const router = express.Router();

router
  .route('/')
  .post(
    auth(roles.accessCategories.user.student.manageStudents),
    validate(studentValidation.createStudent),
    studentController.createStudent
  )
  .get(
    auth(roles.accessCategories.user.student.getStudents),
    validate(studentValidation.getStudents),
    studentController.getStudents
  );

router
  .route('/:studentId')
  .get(
    auth(roles.accessCategories.user.student.getStudents),
    validate(studentValidation.getStudent),
    studentController.getStudent
  )
  .patch(
    auth(roles.accessCategories.user.student.manageStudents),
    validate(studentValidation.updateStudent),
    studentController.updateStudent
  )
  .delete(
    auth(roles.accessCategories.user.student.manageStudents),
    validate(studentValidation.deleteStudent),
    studentController.deleteStudent
  );

module.exports = router;
