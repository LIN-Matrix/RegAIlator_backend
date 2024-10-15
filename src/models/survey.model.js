const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const { date } = require('joi');

const { ObjectId } = mongoose.SchemaTypes;

const surveySchema = mongoose.Schema(
  {
    title: { type: String, required: true }, // Survey的标题(创造者-时间-名称)
    name: { type: String, required: true }, // 调查的名字
    content: { type: String, required: true }, // 调查的内容
    description: { type: String }, // 调查的描述
    attachment: { type: String }, // 调查的附件
    revision: { type: Number, default: 0 }, // 调查的版本号
    createdAt: { type: Date, default: Date.now }, // 调查的创建时间
    updatedAt: { type: Date }, // 调查的更新时间
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
