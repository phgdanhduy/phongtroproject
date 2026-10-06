const profileRepository = require('../repositories/profileRepository');
const roommateRequestRepository = require('../repositories/roommateRequestRepository');
const userRepository = require('../repositories/userRepository');
const roomRepository = require('../repositories/roomRepository');
const { AppError } = require('../utils/errors');

async function getRoommates({ campus, faculty, cohort }) {
  const rows = await profileRepository.findRoommates({ campus, faculty, cohort });

  return rows.map(row => ({
    userId: row.userId,
    fullName: row.fullName,
    studentId: row.studentId,
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
  }));
}

async function createRequest(currentUserId, { receiverId, message }) {
  if (!receiverId) {
    throw new AppError('Vui lòng cung cấp ID người nhận lời mời (receiverId)', 400, 'MISSING_RECEIVER_ID');
  }

  const targetId = parseInt(receiverId, 10);
  if (targetId === currentUserId) {
    throw new AppError('Bạn không thể tự gửi lời mời ghép phòng cho chính mình', 400, 'SELF_INVITATION');
  }

  const receiverCheck = await userRepository.findById(targetId);
  if (!receiverCheck) {
    throw new AppError('Người dùng không tồn tại', 404, 'USER_NOT_FOUND');
  }

  const senderRoom = await roomRepository.findMemberAnyRoom(currentUserId);
  const roomId = senderRoom ? senderRoom.roomId : null;

  const duplicateCheck = await roommateRequestRepository.findPendingRequest(currentUserId, targetId);
  if (duplicateCheck) {
    throw new AppError(
      'Bạn đã gửi lời mời tới sinh viên này rồi, vui lòng chờ họ phản hồi!',
      400,
      'REQUEST_ALREADY_PENDING'
    );
  }

  const newRequest = await roommateRequestRepository.create({
    senderId: currentUserId,
    receiverId: targetId,
    roomId,
    message: message ? message.trim() : null,
    status: 'PENDING'
  });

  return {
    message: `Đã gửi lời mời ghép phòng tới ${receiverCheck.fullName} thành công!`,
    data: newRequest
  };
}

async function getRequests(currentUserId) {
  const received = await roommateRequestRepository.findReceivedRequests(currentUserId);
  const sent = await roommateRequestRepository.findSentRequests(currentUserId);

  return {
    received,
    sent
  };
}

async function respondRequest(currentUserId, requestId, action) {
  if (!['ACCEPT', 'REJECT'].includes(action)) {
    throw new AppError('Hành động không hợp lệ. Vui lòng chọn ACCEPT hoặc REJECT', 400, 'INVALID_ACTION');
  }

  const requestItem = await roommateRequestRepository.findById(requestId);
  if (!requestItem) {
    throw new AppError('Không tìm thấy lời mời ghép phòng này', 404, 'REQUEST_NOT_FOUND');
  }

  if (requestItem.receiverId !== currentUserId) {
    throw new AppError('Bạn không có quyền phản hồi lời mời này', 403, 'FORBIDDEN');
  }

  if (requestItem.status !== 'PENDING') {
    throw new AppError('Lời mời này đã được xử lý trước đó', 400, 'ALREADY_HANDLED');
  }

  if (action === 'REJECT') {
    await roommateRequestRepository.updateStatus(requestId, 'REJECTED');
    return {
      message: 'Đã từ chối lời mời ghép phòng'
    };
  }

  // Handle ACCEPT
  let finalRoomId = requestItem.roomId;

  const receiverInRoom = await roomRepository.findMemberAnyRoom(currentUserId);
  if (receiverInRoom) {
    throw new AppError(
      'Bạn đã thuộc một phòng trọ khác. Vui lòng rời phòng cũ trước khi chấp nhận lời mời!',
      400,
      'USER_ALREADY_IN_ROOM'
    );
  }

  if (finalRoomId) {
    await roomRepository.addMember(finalRoomId, currentUserId, 'MEMBER');
  } else {
    const senderInRoom = await roomRepository.findMemberAnyRoom(requestItem.senderId);
    if (senderInRoom) {
      finalRoomId = senderInRoom.roomId;
      await roomRepository.addMember(finalRoomId, currentUserId, 'MEMBER');
    } else {
      // Neither has room -> create new room automatically
      const senderUser = await userRepository.findById(requestItem.senderId);
      const receiverUser = await userRepository.findById(currentUserId);
      const senderProfile = await profileRepository.findByUserId(requestItem.senderId);

      const senderName = senderUser?.fullName || 'Bạn A';
      const receiverName = receiverUser?.fullName || 'Bạn B';
      const defaultCampus = senderProfile?.campus || 'HOA_LAC';
      const defaultRoomName = `Phòng ghép ${senderName} & ${receiverName}`;

      const newRoom = await roomRepository.create({
        name: defaultRoomName,
        campus: defaultCampus,
        addressOrBlock: 'Chưa cập nhật địa chỉ',
        createdBy: requestItem.senderId
      });

      finalRoomId = newRoom.id;
      await roomRepository.addMember(finalRoomId, requestItem.senderId, 'ADMIN');
      await roomRepository.addMember(finalRoomId, currentUserId, 'MEMBER');
    }
  }

  await roommateRequestRepository.updateStatus(requestId, 'ACCEPTED', finalRoomId);

  return {
    message: '🎉 Đã chấp nhận lời mời ghép phòng! Hệ thống đã tự động tạo phòng trọ chung. Bạn có thể vào "Phòng của tôi" để chỉnh sửa các thông số chi tiết bất kỳ lúc nào.',
    data: {
      roomId: finalRoomId
    }
  };
}

module.exports = {
  getRoommates,
  createRequest,
  getRequests,
  respondRequest
};
