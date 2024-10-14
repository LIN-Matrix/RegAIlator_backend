const Joi = require('joi');
const { objectId } = require('./custom.validation');

// 创建 Survey 的验证
const createSurvey = {
  body: Joi.object().keys({
    title: Joi.string().required(),  // Survey 的标题，必填
    ownerId: Joi.string().custom(objectId).optional(),  // ownerId 必须是 ObjectId
    suppliers: Joi.array().items(Joi.string()).optional(),  // suppliers 必须是 ObjectId 数组
    content: Joi.string().required(),  // Survey 的内容，必填
  }),
};

// 获取多个 Survey 的验证
const getSurveys = {
  query: Joi.object().keys({
    ownerId: Joi.string().custom(objectId),  // 可通过 ownerId 过滤
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
    populate: Joi.string(),
    deepPopulate: Joi.string(),
  }),
};

// 获取单个 Survey 的验证
const getSurvey = {
  params: Joi.object().keys({
    surveyId: Joi.string().custom(objectId),  // 验证 surveyId 是 ObjectId
  }),
};

// 更新 Survey 的验证
const updateSurvey = {
  params: Joi.object().keys({
    surveyId: Joi.required().custom(objectId),  // surveyId 必须是 ObjectId
  }),
  body: Joi.object()
    .keys({
      title: Joi.string(),  // 可选字段：标题
      ownerId: Joi.string().custom(objectId),  // 可选字段：拥有者
      suppliers: Joi.array().items(Joi.string().custom(objectId)),  // 可选字段：供应商数组
      content: Joi.string(),  // 可选字段：内容
    })
    .min(1),  // 至少需要一个字段
};

// 删除 Survey 的验证
const deleteSurvey = {
  params: Joi.object().keys({
    surveyId: Joi.string().custom(objectId),  // 验证 surveyId 是 ObjectId
  }),
};

module.exports = {
  createSurvey,
  getSurveys,
  getSurvey,
  updateSurvey,
  deleteSurvey,
};
