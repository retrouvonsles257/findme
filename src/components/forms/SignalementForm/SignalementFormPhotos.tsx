import React from 'react';
import { SignalementFormData } from './SignalementFormValidation';

export interface SignalementFormPhotosProps {
  data: Partial<SignalementFormData>;
  onChange: (field: keyof SignalementFormData, value: File[]) => void;
  errors: Record<string, string>;
}

export const SignalementFormPhotos: React.FC<SignalementFormPhotosProps> = ({ data, onChange, errors }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onChange('photos', Array.from(e.target.files));
    }
  };

  return (
    <div>
      <h3>Photos/Evidence</h3>

      <div className="form-group">
        <label htmlFor="photos">Upload Photos (Optional)</label>
        <input
          id="photos"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
        {data.photos && data.photos.length > 0 && (
          <p className="file-info">📸 {data.photos.length} photo(s) selected</p>
        )}
      </div>
    </div>
  );
};
