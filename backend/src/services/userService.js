const userRepository = require('../repositories/userRepository');
const profileRepository = require('../repositories/profileRepository');
const { AppError } = require('../utils/errors');

async function getMe(userId) {
  const row = await userRepository.getUserWithProfileAndRoom(userId);

  if (!row) {
    throw new AppError(
      'Không tìm thấy thông tin người dùng',
      404,
      'USER_NOT_FOUND'
    );
  }

  return {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    studentId: row.studentId,
    profile: {
      faculty: row.faculty,
      cohort: row.cohort,
      campus: row.campus,
      locationDetail: row.locationDetail,
      budget: row.budget,
      habits: {
        sleepSchedule: row.sleepSchedule,
        cleanliness: row.cleanliness,
        noiseLevel: row.noiseLevel,
        smoking: row.smoking,
        hasPet: row.hasPet
      },
      bio: row.bio
    },
    roomId: row.roomId || null
  };
}

async function updateProfile(userId, profileData) {
  const {
    faculty,
    cohort,
    campus,
    locationDetail,
    budget,
    habits = {},
    bio
  } = profileData;

  const {
    sleepSchedule = 'NIGHT_OWL',
    cleanliness = 4,
    noiseLevel = 'QUIET',
    smoking = false,
    hasPet = false
  } = habits;

  const updated = await profileRepository.upsert(userId, {
    faculty,
    cohort,
    campus,
    locationDetail,
    budget,
    sleepSchedule,
    cleanliness,
    noiseLevel,
    smoking,
    hasPet,
    bio
  });

  return {
    updatedAt: updated.updatedAt
  };
}

module.exports = {
  getMe,
  updateProfile
};
