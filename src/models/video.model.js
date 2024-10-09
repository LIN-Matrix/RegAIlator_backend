const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const constants = require('../configs/constants');

const { ObjectId } = mongoose.SchemaTypes;

const videoSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    path: { type: String, required: true },
    group: { type: ObjectId, ref: 'VideoGroup' },
    accessState: { type: String, enum: constants.accessState, default: 'private' },
    addedBy: { type: ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
videoSchema.plugin(toJSON);
videoSchema.plugin(paginate);

/**
 * Check if groupName is taken
 * @param title
 * @param {ObjectId} [excludeVideoId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
videoSchema.statics.isTitleTaken = async function (title, excludeVideoId) {
  const video = await this.findOne({ title, _id: { $ne: excludeVideoId } });
  return !!video;
};

/**
 * @typedef Video
 */
const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
