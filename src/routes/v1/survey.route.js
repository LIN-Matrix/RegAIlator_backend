const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const surveyValidation = require('../../validations/survey.validation');
const surveyController = require('../../controllers/survey.controller');
const roles = require('../../configs/roles');

const router = express.Router();

router
  .route('/')
  .post(
    // auth(roles.accessCategories.survey.manageSurveys), // 权限验证，确保用户有创建Survey的权限
    validate(surveyValidation.createSurvey), // 数据验证
    surveyController.createSurvey // 调用controller创建Survey
  )
  .get(
    // auth(roles.accessCategories.survey.getSurveys), // 权限验证，确保用户有获取Survey列表的权限
    validate(surveyValidation.getSurveys), // 数据验证
    surveyController.getSurveys // 调用controller获取Survey列表
  );

router
  .route('/:surveyId')
  .get(
    // auth(roles.accessCategories.survey.getSurveys), // 权限验证，确保用户有获取单个Survey的权限
    validate(surveyValidation.getSurvey), // 数据验证
    surveyController.getSurvey // 调用controller获取单个Survey
  )
  .patch(
    // auth(roles.accessCategories.survey.manageSurveys), // 权限验证，确保用户有更新Survey的权限
    validate(surveyValidation.updateSurvey), // 数据验证
    surveyController.updateSurvey // 调用controller更新Survey
  )
  .delete(
    // auth(roles.accessCategories.survey.manageSurveys), // 权限验证，确保用户有删除Survey的权限
    validate(surveyValidation.deleteSurvey), // 数据验证
    surveyController.deleteSurvey // 调用controller删除Survey
  );

module.exports = router;
