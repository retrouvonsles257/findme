import React from 'react';

export interface AlerteFormData {
  title: string;
  description: string;
  zone: string;
  category: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  notificationMethod: 'email' | 'sms' | 'push' | 'all';
}

export const validateAlertForm = (data: Partial<AlerteFormData>): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.trim() === '') {
    errors.title = 'Title is required';
  }

  if (!data.description || data.description.trim() === '') {
    errors.description = 'Description is required';
  }

  if (!data.zone || data.zone.trim() === '') {
    errors.zone = 'Zone is required';
  }

  if (!data.category || data.category.trim() === '') {
    errors.category = 'Category is required';
  }

  if (!data.startDate) {
    errors.startDate = 'Start date is required';
  }

  if (!data.startTime) {
    errors.startTime = 'Start time is required';
  }

  if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
    errors.endDate = 'End date must be after start date';
  }

  if (!data.frequency) {
    errors.frequency = 'Frequency is required';
  }

  if (!data.notificationMethod) {
    errors.notificationMethod = 'Notification method is required';
  }

  return errors;
};
