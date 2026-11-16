/**
 * Thuật toán tính độ tương đồng không gian vector (Weighted Cosine Similarity)
 * Phục vụ phân hệ Ghép bạn cùng phòng (Matching Domain)
 * Môn: Kiến trúc phần mềm - Giảng viên: Võ Đình Hiếu
 */

function calculateCompatibility(profileA, profileB) {
  if (!profileA || !profileB) {
    return 75; // Điểm mặc định nếu thiếu hồ sơ
  }

  const weights = {
    campus: 3.0,
    sleepSchedule: 2.5,
    cleanliness: 2.0,
    noiseLevel: 2.0,
    budget: 2.0,
    smoking: 1.5,
    location: 1.5,
    hasPet: 1.0,
  };

  let totalWeightedScore = 0;
  let totalWeight = 0;

  // 1. Cơ sở (Campus): Ràng buộc rất mạnh giữa Hòa Lạc và Nội thành
  const campusA = (profileA.campus || 'HOA_LAC').toUpperCase();
  const campusB = (profileB.campus || 'HOA_LAC').toUpperCase();
  const campusSim = campusA === campusB ? 1.0 : 0.0;
  totalWeightedScore += weights.campus * campusSim;
  totalWeight += weights.campus;

  // 2. Giờ giấc sinh hoạt (Sleep schedule)
  const sleepA = (profileA.sleepSchedule || profileA.sleep_schedule || 'NIGHT_OWL').toUpperCase();
  const sleepB = (profileB.sleepSchedule || profileB.sleep_schedule || 'NIGHT_OWL').toUpperCase();
  const sleepSim = sleepA === sleepB ? 1.0 : 0.25;
  totalWeightedScore += weights.sleepSchedule * sleepSim;
  totalWeight += weights.sleepSchedule;

  // 3. Mức độ sạch sẽ (Cleanliness: 1 đến 5)
  const cleanA = Number(profileA.cleanliness) || 4;
  const cleanB = Number(profileB.cleanliness) || 4;
  const cleanDiff = Math.abs(cleanA - cleanB);
  const cleanSim = Math.max(0, 1.0 - cleanDiff / 4.0);
  totalWeightedScore += weights.cleanliness * cleanSim;
  totalWeight += weights.cleanliness;

  // 4. Độ nhạy cảm tiếng ồn (Noise level)
  const noiseA = (profileA.noiseLevel || profileA.noise_level || 'QUIET').toUpperCase();
  const noiseB = (profileB.noiseLevel || profileB.noise_level || 'QUIET').toUpperCase();
  let noiseSim = 0.5;
  if (noiseA === noiseB) {
    noiseSim = 1.0;
  } else if ((noiseA === 'QUIET' && noiseB === 'LOUD') || (noiseA === 'LOUD' && noiseB === 'QUIET')) {
    noiseSim = 0.1;
  }
  totalWeightedScore += weights.noiseLevel * noiseSim;
  totalWeight += weights.noiseLevel;

  // 5. Ngân sách tiền phòng (Budget)
  const budgetA = Number(profileA.budget) || 1500000;
  const budgetB = Number(profileB.budget) || 1500000;
  const maxBudget = Math.max(budgetA, budgetB, 1);
  const budgetDiff = Math.abs(budgetA - budgetB);
  const budgetSim = Math.max(0, 1.0 - budgetDiff / maxBudget);
  totalWeightedScore += weights.budget * budgetSim;
  totalWeight += weights.budget;

  // 6. Thói quen hút thuốc (Smoking)
  const smokeA = Boolean(profileA.smoking);
  const smokeB = Boolean(profileB.smoking);
  const smokeSim = smokeA === smokeB ? 1.0 : 0.0;
  totalWeightedScore += weights.smoking * smokeSim;
  totalWeight += weights.smoking;

  // 7. Thú cưng (Has Pet)
  const petA = Boolean(profileA.hasPet || profileA.has_pet);
  const petB = Boolean(profileB.hasPet || profileB.has_pet);
  const petSim = petA === petB ? 1.0 : 0.3;
  totalWeightedScore += weights.hasPet * petSim;
  totalWeight += weights.hasPet;

  // 8. Vị trí chi tiết (Tòa KTX hoặc Quận nội thành)
  const dormA = (profileA.dormBuilding || profileA.dorm_building || '').trim().toLowerCase();
  const dormB = (profileB.dormBuilding || profileB.dorm_building || '').trim().toLowerCase();
  const distA = (profileA.district || '').trim().toLowerCase();
  const distB = (profileB.district || '').trim().toLowerCase();
  let locSim = 1.0;
  if (campusA === 'HOA_LAC') {
    if (dormA && dormB) {
      locSim = dormA === dormB ? 1.0 : 0.4;
    } else if (dormA || dormB) {
      locSim = 0.8; // Một bạn linh hoạt, một bạn có tòa ưu tiên
    } else {
      locSim = 1.0;
    }
  } else if (campusA === 'NOI_THANH') {
    if (distA && distB) {
      locSim = distA === distB ? 1.0 : 0.3;
    } else if (distA || distB) {
      locSim = 0.8;
    } else {
      locSim = 1.0;
    }
  }
  totalWeightedScore += weights.location * locSim;
  totalWeight += weights.location;

  const scorePercent = Math.round((totalWeightedScore / totalWeight) * 100);
  return Math.min(100, Math.max(0, scorePercent));
}

module.exports = {
  calculateCompatibility,
};
