//frontend/src/services/report.service.ts
// this file is used to interact with the backend API for report-related operations
import apiClient from './api.client';

export const reportService = {
  //function to download user report as a blob
  downloadUserReport: async (userId: string, month: number, year: number) => {
    return apiClient.get('/reports/user-report', {
      params: { userId, month, year },
      responseType: 'blob' // important for file downloads
    });
  },

  //function to download job report as a blob
  downloadJobReport: async (month: number, year: number) => {
    return apiClient.get('/reports/job-report', {
      params: { month, year },
      responseType: 'blob'
    });
  }
};