class AppValidationError extends Error {
    constructor(message, errorCode = 'INVALID_SPLIT_PAYLOAD') {
        super(message);
        this.statusCode = 400;
        this.errorCode = errorCode;
    }
}

/**
 * Interface ISplitStrategy
 */
class ISplitStrategy {
    /**
     * @param {number} totalAmount Tổng số tiền hóa đơn
     * @param {Array<{user_id: number}>} roomMembers Danh sách thành viên phòng
     * @param {Object} payload Dữ liệu đầu vào tùy theo chiến lược
     * @returns {Array<{userId: number, splitAmount: number, metadata?: Object}>}
     */
    calculate(totalAmount, roomMembers, payload) {
        throw new Error("Method 'calculate()' must be implemented.");
    }
}

/**
 * 1. EqualSplitStrategy: Chia đều cho tất cả thành viên (xử lý làm tròn không lệch 1đ)
 */
class EqualSplitStrategy extends ISplitStrategy {
    calculate(totalAmount, roomMembers) {
        if (!roomMembers || roomMembers.length === 0) {
            throw new AppValidationError('Phòng chưa có thành viên nào', 'EMPTY_ROOM');
        }

        const count = roomMembers.length;
        const baseShare = Math.floor(totalAmount / count);
        const remainder = totalAmount - baseShare * count;

        return roomMembers.map((member, idx) => ({
            userId: Number(member.userId || member.user_id),
            splitAmount: idx === 0 ? baseShare + remainder : baseShare,
            metadata: { strategy: 'EQUAL' }
        }));
    }
}

/**
 * 2. CustomSplitStrategy: Chia tùy chỉnh theo số tiền cụ thể từng người
 * payload.splits = [{ userId: 1, amount: 200000 }, { userId: 2, amount: 100000 }]
 */
class CustomSplitStrategy extends ISplitStrategy {
    calculate(totalAmount, roomMembers, payload) {
        const { splits } = payload;
        if (!Array.isArray(splits) || splits.length === 0) {
            throw new AppValidationError('Thiếu danh sách phân chia tùy chỉnh (splits)');
        }

        const validMemberIds = new Set(roomMembers.map((m) => Number(m.userId || m.user_id)));
        let sum = 0;

        const results = splits.map((item) => {
            const userId = Number(item.userId);
            const amount = Number(item.amount);

            if (!validMemberIds.has(userId)) {
                throw new AppValidationError(`Thành viên userId=${userId} không thuộc phòng này`);
            }
            if (Number.isNaN(amount) || amount < 0) {
                throw new AppValidationError(`Số tiền chia cho userId=${userId} không hợp lệ`);
            }

            sum += amount;
            return {
                userId,
                splitAmount: amount,
                metadata: { strategy: 'CUSTOM' }
            };
        });

        if (Math.abs(sum - totalAmount) > 1) {
            throw new AppValidationError(
                `Tổng tiền phân chia (${sum}) không khớp tổng hóa đơn (${totalAmount})`
            );
        }

        return results;
    }
}

/**
 * 3. MeteredSplitStrategy: Tính tiền điện/nước theo chỉ số đồng hồ riêng + chia đều phần chung
 * payload.meters = [{ userId: 1, oldIndex: 100, newIndex: 140 }, ...]
 * payload.unitPrice = 3500 (đơn giá / số)
 */
class MeteredSplitStrategy extends ISplitStrategy {
    calculate(totalAmount, roomMembers, payload) {
        const { meters, unitPrice } = payload;
        if (!Array.isArray(meters) || meters.length === 0 || !unitPrice || Number(unitPrice) <= 0) {
            throw new AppValidationError('Thiếu danh sách chỉ số (meters) hoặc đơn giá (unitPrice > 0)');
        }

        const validMemberIds = new Set(roomMembers.map((m) => Number(m.userId || m.user_id)));
        const price = Number(unitPrice);
        let meteredSum = 0;
        const meteredMap = new Map();

        for (const m of meters) {
            const userId = Number(m.userId);
            const oldIdx = Number(m.oldIndex);
            const newIdx = Number(m.newIndex);

            if (!validMemberIds.has(userId)) {
                throw new AppValidationError(`Thành viên userId=${userId} không thuộc phòng này`);
            }
            if (newIdx < oldIdx) {
                throw new AppValidationError(`Chỉ số mới (${newIdx}) nhỏ hơn chỉ số cũ (${oldIdx}) của userId=${userId}`);
            }

            const usage = newIdx - oldIdx;
            const cost = Math.round(usage * price);
            meteredSum += cost;
            meteredMap.set(userId, { oldIndex: oldIdx, newIndex: newIdx, usage, unitPrice: price, personalCost: cost });
        }

        if (meteredSum > totalAmount) {
            throw new AppValidationError(
                `Tổng tiền theo chỉ số (${meteredSum}) vượt quá tổng hóa đơn (${totalAmount})`
            );
        }

        // Phần chênh lệch (điện/nước hành lang, nhà vệ sinh chung) chia đều cho cả phòng
        const sharedRemainder = totalAmount - meteredSum;
        const baseShared = Math.floor(sharedRemainder / roomMembers.length);
        const roundingDiff = sharedRemainder - baseShared * roomMembers.length;

        return roomMembers.map((member, idx) => {
            const uid = Number(member.userId || member.user_id);
            const personal = meteredMap.get(uid) || { oldIndex: 0, newIndex: 0, usage: 0, unitPrice: price, personalCost: 0 };
            const sharedPart = idx === 0 ? baseShared + roundingDiff : baseShared;

            return {
                userId: uid,
                splitAmount: personal.personalCost + sharedPart,
                metadata: {
                    strategy: 'METERED',
                    ...personal,
                    sharedCost: sharedPart
                }
            };
        });
    }
}

class SplitStrategyFactory {
    static getStrategy(splitType = 'EQUAL') {
        switch (splitType.toUpperCase()) {
            case 'EQUAL':
                return new EqualSplitStrategy();
            case 'CUSTOM':
                return new CustomSplitStrategy();
            case 'METERED':
                return new MeteredSplitStrategy();
            default:
                throw new AppValidationError(`Chiến lược chia tiền không hỗ trợ: ${splitType}`);
        }
    }
}

module.exports = {
    ISplitStrategy,
    EqualSplitStrategy,
    CustomSplitStrategy,
    MeteredSplitStrategy,
    SplitStrategyFactory
};
