const mongoose = require('mongoose');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rollNoPattern = /^[A-Z0-9-]{3,20}$/;

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      match: rollNoPattern
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: emailPattern
    },
    course: {
      type: String,
      enum: ['CSE', 'ECE', 'ME', 'CE'],
      required: true
    },
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      validate: {
        validator: Number.isInteger,
        message: 'Year must be an integer.'
      }
    },
    gpa: {
      type: Number,
      required: true,
      min: 0,
      max: 10
    }
  },
  { timestamps: true }
);

studentSchema.index({ course: 1, gpa: 1 });

module.exports = mongoose.model('Student', studentSchema);
