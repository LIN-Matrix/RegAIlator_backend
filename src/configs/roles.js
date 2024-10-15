const { Survey } = require("../models");

const subUserRoles = {
  student: 'student',
  instructor: 'instructor',
};

const accessCategories = {
  user: {
    getUsers: 'getUsers',
    manageUsers: 'manageUsers',
    instructor: {
      getInstructors: 'getInstructors',
      manageInstructors: 'manageInstructors',
      all: ['getInstructors', 'manageInstructors'],
    },
    student: {
      getStudents: 'getStudents',
      manageStudents: 'manageStudents',
      all: ['getStudents', 'manageStudents'],
    },
    all: ['getUsers', 'manageUsers', 'getInstructors', 'manageInstructors', 'getStudents', 'manageStudents'],
  },
  videoGroup: {
    getVideoGroups: 'getVideoGroups',
    manageVideoGroups: 'manageVideoGroups',
    all: ['getVideoGroups', 'manageVideoGroups'],
  },
  video: {
    getVideo: 'getVideo',
    manageVideo: 'manageVideo',
    all: ['getVideo', 'manageVideo'],
  },
  watchLog: {
    getWatchLog: 'getWatchLog',
    manageWatchLog: 'manageWatchLog',
    all: ['getWatchLog', 'manageWatchLog'],
  },
  errorLog: {
    getErrorLog: 'getErrorLog',
    manageErrorLog: 'manageErrorLog',
    all: ['getErrorLog', 'manageErrorLog'],
  },
  survey: {
    getSurveyTemplates: 'getSurveyTemplates',
    manageSurveyTemplates: 'manageSurveyTemplates',
    all: ['getSurveyTemplates', 'manageSurveyTemplates'],
  }
};

const allRoles = {
  admin: [
    ...accessCategories.user.all,
    ...accessCategories.videoGroup.all,
    ...accessCategories.video.all,
    ...accessCategories.watchLog.all,
    ...accessCategories.errorLog.all,
    accessCategories.user.student.getStudents,
    accessCategories.user.instructor.getInstructors,
  ],
  supervisor: [
    ...accessCategories.user.all,
    ...accessCategories.videoGroup.all,
    ...accessCategories.video.all,
    ...accessCategories.watchLog.all,
    ...accessCategories.errorLog.all,
    accessCategories.user.student.getStudents,
    accessCategories.user.instructor.getInstructors,
  ],
  manager: [
    ...accessCategories.user.all,
    ...accessCategories.videoGroup.all,
    ...accessCategories.video.all,
    ...accessCategories.watchLog.all,
    ...accessCategories.errorLog.all,
    accessCategories.user.student.getStudents,
    accessCategories.user.instructor.getInstructors,
  ],
  [subUserRoles.instructor]: [
    ...accessCategories.user.all,
    ...accessCategories.videoGroup.all,
    ...accessCategories.video.all,
    ...accessCategories.watchLog.all,
    ...accessCategories.errorLog.all,
    accessCategories.user.student.getStudents,
    accessCategories.user.instructor.getInstructors,
  ],
  [subUserRoles.student]: [
    ...accessCategories.user.all,
    ...accessCategories.videoGroup.all,
    ...accessCategories.video.all,
    ...accessCategories.watchLog.all,
    ...accessCategories.errorLog.all,
    accessCategories.user.student.getStudents,
    accessCategories.user.instructor.getInstructors,
  ],
  guest: [
    ...accessCategories.user.all,
    ...accessCategories.videoGroup.all,
    ...accessCategories.video.all,
    ...accessCategories.watchLog.all,
    ...accessCategories.errorLog.all,
    accessCategories.user.student.getStudents,
    accessCategories.user.instructor.getInstructors,
  ],
};

const roles = Object.keys(allRoles);

const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
  subUserRoles,
  accessCategories,
};
