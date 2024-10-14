const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId } = mongoose.SchemaTypes;

const surveySchema = mongoose.Schema(
  {
    title: { type: String, required: true }, // Survey的标题
    ownerId: { type: String, ref: 'User' }, // 拥有者的用户ID，不需要required，因为可以是匿名的
    suppliers: [{ type: String, ref: 'Supplier' }], // 供应商ID数组
    content: { type: String, required: true }, // 调查的内容
  },
  {
    timestamps: true, // 自动生成createdAt和updatedAt字段
  }
);

// 插件转换Mongoose文档为JSON格式
surveySchema.plugin(toJSON);
surveySchema.plugin(paginate);

/**
 * 检查是否已经存在相同的title
 * @param {string} title
 * @param {ObjectId} [excludeSurveyId] - 需要排除的survey ID
 * @returns {Promise<boolean>}
 */
surveySchema.statics.isTitleTaken = async function (title, excludeSurveyId) {
  const survey = await this.findOne({ title, _id: { $ne: excludeSurveyId } });
  return !!survey;
};

/**
 * @typedef Survey
 */
const Survey = mongoose.model('Survey', surveySchema);

module.exports = Survey;
