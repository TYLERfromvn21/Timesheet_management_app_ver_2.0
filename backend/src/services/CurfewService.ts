// backend/src/services/CurfewService.ts
// This file defines a service to check if the current time falls within a restricted curfew period.
export const CurfewService = {

    isRestricted: (): boolean => {
        const now = new Date();
        const hour = now.getHours();
        
        // if current time is between 11 PM and 6 AM, return true 
        // for restricted curfew period
        if (hour >= 23 || hour < 6) {
            return true;
        }
        return false;
    }
};