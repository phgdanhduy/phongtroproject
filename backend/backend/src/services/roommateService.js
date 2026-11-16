const profileRepository = require('../repositories/profileRepository');
const roommateRequestRepository = require('../repositories/roommateRequestRepository');
const userRepository = require('../repositories/userRepository');
const roomRepository = require('../repositories/roomRepository');
const { calculateCompatibility } = require('./matchingAlgorithm');
const { AppError } = require('../utils/errors');

function maskPhoneNumber(phone) {
  if (!phone) return '0987*** (Chấp nhận ghép để xem)';
  const cleaned = String(phone).trim();
  if (cleaned.length <= 4) return '0987*** (Chấp nhận ghép để xem)';
  return `${cleaned.substring(0, 4)}*** (Chấp nhận ghép để xem)`;
}

async function getRoommates({ campus, faculty, cohort, dormBuilding, district, radiusKm, currentUserId }) {
  const rows = await profileRepository.findRoommates({ campus, faculty, cohort, dormBuilding, district });

  let currentUserProfile = null;
  let relationshipsMap = new Map();

  if (currentUserId) {
    currentUserProfile = await profileRepository.findByUserId(currentUserId);
    relationshipsMap = await roommateRequestRepository.findAllRelationshipsForUser(currentUserId);
  }

  // Lọc bỏ chính người dùng hiện tại nếu có
  const filteredRows = currentUserId
    ? rows.filter(r => r.userId !== currentUserId)
    : rows;

  // Lọc thêm theo radiusKm nếu có (ví dụ: bán kính 1km, 2km, 3km)
  const candidateRows = filteredRows.filter(row => {
    if (!radiusKm) return true;
    const maxRadius = parseFloat(radiusKm);
    if (isNaN(maxRadius)) return true;
    
    // Nếu trong locationDetail có ghi ví dụ "bán kính < 2km" thì trích xuất số
    const match = String(row.locationDetail || '').match(/(\d+(\.\d+)?)\s*km/i);
    if (match) {
      const dist = parseFloat(match[1]);
      return dist <= maxRadius;
    }
    return true;
  });

  const candidates = candidateRows.map(row => {
    // 1. Tính toán điểm tương thích lối sống theo Weighted Cosine Similarity
    const score = currentUserProfile
      ? calculateCompatibility(currentUserProfile, row)
      : 75;

    // 2. Kiểm tra trạng thái kết nối & Cơ chế Mutual Privacy Gate
    const matchStatus = relationshipsMap.get(row.userId) || 'NONE';
    const isUnlocked = matchStatus === 'ACCEPTED';

    const contact = {
      phone: isUnlocked ? (row.phone || '0987654321') : maskPhoneNumber(row.phone),
      zalo: isUnlocked ? (row.zalo || '0987654321') : null,
      isUnlocked
    };

    return {
      userId: row.userId,
      fullName: row.fullName,
      studentId: row.studentId,
      faculty: row.faculty,
      cohort: row.cohort,
      campus: row.campus,
      locationDetail: row.locationDetail,
      dormBuilding: row.dormBuilding || null,
      district: row.district || null,
      budget: Number(row.budget) || 1500000,
      habits: {
        sleepSchedule: row.sleepSchedule,
        cleanliness: Number(row.cleanliness) || 4,
        noiseLevel: row.noiseLevel,
        smoking: Boolean(row.smoking),
        hasPet: Boolean(row.hasPet)
      },
      bio: row.bio,
      compatibilityScore: score,
      matchStatus,
      contact
    };
  });

  // Sắp xếp theo điểm tương thích giảm dần (người hợp nhất lên đầu)
  if (currentUserProfile) {
    candidates.sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0));
  }

  return candidates;
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
  const rawReceived = await roommateRequestRepository.findReceivedRequests(currentUserId);
  const rawSent = await roommateRequestRepository.findSentRequests(currentUserId);

  const received = rawReceived.map(r => {
    const isUnlocked = r.status === 'ACCEPTED';
    return {
      id: r.id,
      status: r.status,
      message: r.message,
      createdAt: r.createdAt,
      senderId: r.senderId,
      senderName: r.senderName,
      senderStudentId: r.senderStudentId,
      senderFaculty: r.senderFaculty,
      senderCohort: r.senderCohort,
      senderCampus: r.senderCampus,
      roomId: r.roomId,
      roomName: r.roomName,
      contact: {
        phone: isUnlocked ? (r.senderPhone || '0912345678') : maskPhoneNumber(r.senderPhone),
        zalo: isUnlocked ? (r.senderZalo || '0912345678') : null,
        isUnlocked
      }
    };
  });

  const sent = rawSent.map(s => {
    const isUnlocked = s.status === 'ACCEPTED';
    return {
      id: s.id,
      status: s.status,
      message: s.message,
      createdAt: s.createdAt,
      receiverId: s.receiverId,
      receiverName: s.receiverName,
      receiverStudentId: s.receiverStudentId,
      receiverFaculty: s.receiverFaculty,
      receiverCohort: s.receiverCohort,
      receiverCampus: s.receiverCampus,
      roomId: s.roomId,
      roomName: s.roomName,
      contact: {
        phone: isUnlocked ? (s.receiverPhone || '0987654321') : maskPhoneNumber(s.receiverPhone),
        zalo: isUnlocked ? (s.receiverZalo || '0987654321') : null,
        isUnlocked
      }
    };
  });

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
