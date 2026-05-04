// backend/src/services/CurfewService.ts
// This file defines a service to check if the current time falls within a restricted curfew period.
export const CurfewService = {

    isRestricted: (): boolean => {
        const now = new Date();
        // Get UTC hour and convert to Vietnam time (UTC+7)
        const utcHour = now.getUTCHours();
        const vietnamHour = (utcHour + 7) % 24;
        
        // if current time is between 11 PM and 6 AM (Vietnam time), return true 
        // for restricted curfew period
        if (vietnamHour >= 23 || vietnamHour < 6) {
            return true;
        }
        return false;
    }
};