import React from 'react';
import { AlerteFormData } from './AlerteFormValidation';

export interface AlerteFormScheduleProps {
  data: Partial<AlerteFormData>;
  onChange: (field: keyof AlerteFormData, value: string) => void;
  errors: Record<string, string>;
}

export const AlerteFormSchedule: React.FC<AlerteFormScheduleProps> = ({ data, onChange, errors }) => {
  return (
    <div>
      <h3>Schedule & Notifications</h3>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="startDate">Start Date *</label>
          <input
            id="startDate"
            type="date"
            value={data.startDate || ''}
            onChange={(e) => onChange('startDate', e.target.value)}
            className={errors.startDate ? 'input-error' : ''}
          />
          {errors.startDate && <span className="error-message">{errors.startDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="startTime">Start Time *</label>
          <input
            id="startTime"
            type="time"
            value={data.startTime || ''}
            onChange={(e) => onChange('startTime', e.target.value)}
            className={errors.startTime ? 'input-error' : ''}
          />
          {errors.startTime && <span className="error-message">{errors.startTime}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="endDate">End Date</label>
          <input
            id="endDate"
            type="date"
            value={data.endDate || ''}
            onChange={(e) => onChange('endDate', e.target.value)}
            className={errors.endDate ? 'input-error' : ''}
          />
          {errors.endDate && <span className="error-message">{errors.endDate}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="endTime">End Time</label>
          <input
            id="endTime"
            type="time"
            value={data.endTime || ''}
            onChange={(e) => onChange('endTime', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="frequency">Frequency *</label>
        <select
          id="frequency"
          value={data.frequency || ''}
          onChange={(e) => onChange('frequency', e.target.value)}
          className={errors.frequency ? 'input-error' : ''}
        >
          <option value="">Select frequency</option>
          <option value="once">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        {errors.frequency && <span className="error-message">{errors.frequency}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="notificationMethod">Notification Method *</label>
        <select
          id="notificationMethod"
          value={data.notificationMethod || ''}
          onChange={(e) => onChange('notificationMethod', e.target.value)}
          className={errors.notificationMethod ? 'input-error' : ''}
        >
          <option value="">Select notification method</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="push">Push Notification</option>
          <option value="all">All Methods</option>
        </select>
        {errors.notificationMethod && <span className="error-message">{errors.notificationMethod}</span>}
      </div>
    </div>
  );
};
