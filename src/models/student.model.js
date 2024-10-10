const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId } = mongoose.SchemaTypes;

const StudentSchema = mongoose.Schema(
  {
    userId: { type: ObjectId, ref: 'User', required: true },
    instructors: [{ type: ObjectId, ref: 'Instructor' }],
    videoGroups: [{ type: ObjectId, ref: 'VideoGroup' }],
    department: { type: String },
    status: { type: String, default: 'inactive' },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
StudentSchema.plugin(toJSON);
StudentSchema.plugin(paginate);
/**
 * @typedef Student
 */
const Student = mongoose.model('Student', StudentSchema);

StudentSchema.pre('remove', function (next) {
  // Remove all the users docs that reference the removed student.
  this.model('User').remove({ _id: this.userId }, next);
});

module.exports = Student;
