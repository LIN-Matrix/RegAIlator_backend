const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');
const constants = require('../configs/constants');

const videoGroupSchema = mongoose.Schema(
  {
    groupName: { type: String, unique: true, required: true },
    addedBy: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true },
    accessState: { type: String, enum: constants.accessState, default: 'private' },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
videoGroupSchema.plugin(toJSON);
videoGroupSchema.plugin(paginate);

/**
 * Check if groupName is taken
 * @param groupName
 * @param {ObjectId} [excludeGroupId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
videoGroupSchema.statics.isGroupNameTaken = async function (groupName, excludeGroupId) {
  const videoGroup = await this.findOne({ groupName, _id: { $ne: excludeGroupId } });
  return !!videoGroup;
};

videoGroupSchema.pre('remove', async function (next) {
  this.model('Video').remove({ group: this._id }, next);
  this.model('Instructor').remove({ videoGroups: this._id }, next);
  this.model('Student').remove({ videoGroups: this._id }, next);
});

/**
 * @typedef VideoGroup
 */
const VideoGroup = mongoose.model('VideoGroup', videoGroupSchema);

module.exports = VideoGroup;
