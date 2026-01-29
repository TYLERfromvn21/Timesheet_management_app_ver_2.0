// backend/src/services/CurfewService.ts

export const CurfewService = {
    /**
     * Kiểm tra xem giờ hiện tại có nằm trong khung giờ cấm không.
     * Rule: Cấm từ 23:00 đêm đến 06:00 sáng hôm sau.
     * @returns true nếu bị cấm, false nếu được phép.
     */
    isRestricted: (): boolean => {
        const now = new Date();
        const hour = now.getHours();
        
        // Cấm nếu giờ >= 23 HOẶC giờ < 6
        if (hour >= 23 || hour < 6) {
            return true;
        }
        return false;
    }
};