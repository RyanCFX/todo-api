import { ClassConstructor, ClassTransformOptions } from 'class-transformer';
import { ValidationError } from 'class-validator';
import * as CryptoJS from 'crypto-js';
import { Request } from 'express';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface FilteredObject<T> {
  [key: string]: any;
}

export function formatErrors(errors: ValidationError[]) {
  return errors?.map((error) => Object.values(error.constraints)).flat();
}

export const format = {
  ip: (data: string) => {
    const splited = data.split(':');
    const ip = splited[splited?.length - 1];

    return ip;
  },
  objectByInterface<T>(obj: any, keys: Array<keyof T>): FilteredObject<T> {
    const result: Partial<T> = {};

    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }

    return result;
  },
  creditCardDate: (value: string) => {
    const [month, year] = value.split('/').map(Number);
    const fullYear = 2000 + year;

    return new Date(fullYear, month - 1);
  },
  transactionData: (req: Request) => ({
    user: req.cookies.user,
    userAgent: req.headers['user-agent'],
    ip: format.ip(req.ip),
  }),
  base64: (data: string) => {
    if (data?.includes('base64')) {
      return data?.split(',')[1];
    }

    return data;
  },
  abbId: (id: string) => {
    if (id?.length <= 6) {
      return id;
    }
    return id?.slice(0, 6);
  },
};

export const crypto = {
  encrypt: (data: string) => {
    return CryptoJS.AES.encrypt(data, 'ADB123').toString();
  },
  decrypt: (data: string) => {
    const bytes = CryptoJS.AES.decrypt(data, 'ADB123');

    const decripted = bytes.toString(CryptoJS.enc.Utf8);

    return decripted.slice(1, decripted.length - 1);
  },
};

export function generateString(length: number = 6): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

export function isBase64(str: string) {
  if (typeof str !== 'string') {
    return false;
  }

  // Verifica si la longitud es múltiplo de 4 y si solo contiene caracteres base64 válidos
  const base64Regex =
    /^(?:[A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

  return base64Regex.test(str);
}

export function loadDefaultData<T>(def: T, data: Partial<T>) {
  const keys = Object.keys(def);

  const to = {};

  keys.map((key) => {
    to[key] = data?.[key] || def[key];
  });

  return to;
}

export function generateRandomString(length: number): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result.toUpperCase();
}
