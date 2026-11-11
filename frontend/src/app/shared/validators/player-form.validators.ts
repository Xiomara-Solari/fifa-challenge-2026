import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

export function notBlank(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (typeof value !== 'string') {
      return null;
    }

    return value.trim().length === 0 ? { notBlank: true } : null;
  };
}

export function optionalNotBlank(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }

    return value.trim().length === 0 ? { notBlank: true } : null;
  };
}

export function httpUrl(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (typeof value !== 'string' || value.trim().length === 0) {
      return null;
    }

    return HTTP_URL_PATTERN.test(value.trim()) ? null : { url: true };
  };
}

export function integerRange(min: number, max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return { notANumber: true };
    }

    if (!Number.isInteger(value)) {
      return { integer: true };
    }

    if (value < min) {
      return { min: { min, actual: value } };
    }

    if (value > max) {
      return { max: { max, actual: value } };
    }

    return null;
  };
}
