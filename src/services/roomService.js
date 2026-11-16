const roomRepository = require('../repositories/roomRepository');
const userRepository = require('../repositories/userRepository');
const roommateRequestRepository = require('../repositories/roommateRequestRepository');
const { AppError } = require('../utils/errors');

async function createRoom(userId, { name, campus = 'HOA_LAC', addressOrBlock }, userInfo) {
  if (!name || !name.trim()) {
    throw new AppError('Vui lòng nhập tên phòng trọ / KTX', 400, 'MISSING_NAME');
  }

  const existingMember = await roomRepository.findMemberAnyRoom(userId);
  if (existingMember) {
    throw new AppError(
      'Bạn đã thuộc một phòng trọ khác. Vui lòng rời phòng cũ trước khi tạo mới.',
      400,
      'USER_ALREADY_IN_ROOM'
    );
  }

  const newRoom = await roomRepository.create({
    name: name.trim(),
    campus,
    addressOrBlock: addressOrBlock ? addressOrBlock.trim() : null,
    createdBy: userId
  });

  await roomRepository.addMember(newRoom.id, userId, 'ADMIN');

  return {
    ...newRoom,
    members: [
      {
        userId,
        fullName: userInfo?.fullName,
        studentId: userInfo?.studentId,
        role: 'ADMIN'
      }
    ]
  };
}

async function getMyRoom(userId) {
  const room = await roomRepository.findByUserId(userId);
  if (!room) {
    throw new AppError('Bạn chưa tham gia phòng trọ nào', 404, 'ROOM_NOT_FOUND');
  }

  const members = await roomRepository.findMembersByRoomId(room.id);

  return {
    ...room,
    members
  };
}

async function addMember(currentUserId, roomId, studentEmail) {
  if (!studentEmail || !studentEmail.trim()) {
    throw new AppError('Vui lòng cung cấp email sinh viên cần thêm vào phòng', 400, 'MISSING_EMAIL');
  }

  const requesterRole = await roomRepository.findMember(roomId, currentUserId);
  if (!requesterRole) {
    throw new AppError('Bạn không thuộc phòng trọ này', 403, 'FORBIDDEN');
  }

  if (requesterRole.role !== 'ADMIN') {
    throw new AppError('Chỉ trưởng phòng (ADMIN) mới có quyền thêm thành viên', 403, 'FORBIDDEN_NOT_ADMIN');
  }

  const userToAdd = await userRepository.findByEmail(studentEmail.trim().toLowerCase());
  if (!userToAdd) {
    throw new AppError('Không tìm thấy người dùng với email này trong hệ thống', 404, 'USER_NOT_FOUND');
  }

  const userInRoom = await roomRepository.findMemberAnyRoom(userToAdd.id);
  if (userInRoom) {
    if (userInRoom.roomId === roomId) {
      throw new AppError('Sinh viên này đã là thành viên trong phòng rồi', 400, 'USER_ALREADY_MEMBER');
    }
    throw new AppError('Sinh viên này hiện đã thuộc một phòng trọ khác', 400, 'USER_ALREADY_IN_ROOM');
  }

  const pendingCheck = await roommateRequestRepository.findPendingRoomInvite(userToAdd.id, roomId);
  if (pendingCheck) {
    throw new AppError(
      'Đã gửi lời mời tham gia phòng tới sinh viên này trước đó, đang chờ bạn ấy phản hồi',
      400,
      'INVITATION_ALREADY_PENDING'
    );
  }

  const roomInfo = await roomRepository.findById(roomId);
  const roomName = roomInfo?.name || 'phòng trọ';

  await roommateRequestRepository.create({
    senderId: currentUserId,
    receiverId: userToAdd.id,
    roomId,
    message: `Trưởng phòng mời bạn tham gia vào ${roomName}`,
    status: 'PENDING'
  });

  return {
    message: `Đã gửi lời mời tham gia phòng tới ${userToAdd.fullName} (${userToAdd.email}) thành công! Lời mời đã được chuyển tới mục "Lời mời đã nhận" của bạn ấy.`,
    data: {
      userId: userToAdd.id,
      fullName: userToAdd.fullName,
      studentId: userToAdd.studentId,
      status: 'PENDING'
    }
  };
}

async function updateRoom(currentUserId, roomId, { name, campus, addressOrBlock }) {
  const requesterRole = await roomRepository.findMember(roomId, currentUserId);
  if (!requesterRole || requesterRole.role !== 'ADMIN') {
    throw new AppError('Chỉ trưởng phòng (ADMIN) mới có quyền chỉnh sửa thông số phòng', 403, 'FORBIDDEN_NOT_ADMIN');
  }

  const updated = await roomRepository.updateRoom(roomId, {
    name: name ? name.trim() : null,
    campus: campus || null,
    addressOrBlock: addressOrBlock ? addressOrBlock.trim() : null
  });

  return updated;
}

async function deleteRoom(currentUserId, roomId) {
  const requesterRole = await roomRepository.findMember(roomId, currentUserId);
  if (!requesterRole) {
    throw new AppError('Bạn không thuộc phòng trọ này', 403, 'FORBIDDEN');
  }

  if (requesterRole.role !== 'ADMIN') {
    throw new AppError('Chỉ trưởng phòng (ADMIN) mới có quyền giải tán/xóa phòng', 403, 'FORBIDDEN_NOT_ADMIN');
  }

  await roomRepository.deleteRoom(roomId);
  return { message: 'Đã giải tán phòng trọ thành công' };
}

async function leaveRoom(currentUserId, roomId) {
  const memberCheck = await roomRepository.findMember(roomId, currentUserId);
  if (!memberCheck) {
    throw new AppError('Bạn không thuộc phòng trọ này', 403, 'FORBIDDEN');
  }

  const allMembers = await roomRepository.findMembersByRoomId(roomId);
  if (allMembers.length <= 1) {
    await roomRepository.deleteRoom(roomId);
    return { message: 'Bạn là thành viên duy nhất, phòng đã được giải tán thành công' };
  }

  if (memberCheck.role === 'ADMIN') {
    const nextAdmin = allMembers.find(m => m.userId !== currentUserId);
    if (nextAdmin) {
      await roomRepository.updateMemberRole(roomId, nextAdmin.userId, 'ADMIN');
    }
  }

  await roomRepository.removeMember(roomId, currentUserId);
  return { message: 'Đã rời khỏi phòng thành công' };
}

async function getRoomInvitations(roomId) {
  return await roommateRequestRepository.findRoomPendingInvitations(roomId);
}

module.exports = {
  createRoom,
  getMyRoom,
  addMember,
  updateRoom,
  deleteRoom,
  leaveRoom,
  getRoomInvitations
};
