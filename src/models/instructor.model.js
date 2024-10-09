const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId } = mongoose.SchemaTypes;

const InstructorSchema = mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true },
    videoGroups: [{ type: ObjectId, ref: 'VideoGroup' }],
    department: { type: String },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
InstructorSchema.plugin(toJSON);
InstructorSchema.plugin(paginate);

/**
 * @typedef Instructor
 */
const Instructor = mongoose.model('Instructor', InstructorSchema);

InstructorSchema.pre('remove', async function (next) {
  this.model('Student').remove({ instructors: this._id }, next);
});

module.exports = Instructor;
