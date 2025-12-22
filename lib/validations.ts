// lib/validations.ts
import { z } from 'zod';
import xss from 'xss';

const sanitize = (val: string) => xss(val);

// --- SCHEMAS ---

// 1. User Profile Update Schema
export const profileSchema = z.object({
    name: z.string()
        .min(2, "الاسم قصير جدًا")
        .max(50, "الاسم طويل جدًا")
        .transform(sanitize),
    username: z.string()
        .min(3, "اسم المستخدم يجب أن يكون 3 أحرف على الأقل")
        .max(20, "اسم المستخدم طويل جدًا")
        .regex(/^[a-z0-9_]+$/, "يسمح فقط بالأحرف الإنجليزية والأرقام والشرطة السفلية")
        .transform(val => val.toLowerCase()),
    bio: z.string()
        .max(500, "النبذة طويلة جدًا (الحد 500 حرف)")
        .optional()
        .transform(val => val ? sanitize(val) : ""),
    twitterHandle: z.string().max(30).optional().transform(val => val ? sanitize(val) : ""),
    instagramHandle: z.string().max(30).optional().transform(val => val ? sanitize(val) : ""),
}).strict(); // REJECT UNKNOWN KEYS

// 2. Sign Up Schema
export const signUpSchema = z.object({
    name: z.string().min(2).max(50).transform(sanitize),
    email: z.string().email("البريد الإلكتروني غير صالح").toLowerCase(),
    password: z.string()
        .min(8, "كلمة السر يجب أن تكون 8 أحرف على الأقل")
        .max(100)
        .regex(/[0-9]/, "كلمة السر يجب أن تحتوي على رقم واحد على الأقل"),
    username: z.string()
        .min(3)
        .max(20)
        .regex(/^[a-z0-9_]+$/, "اسم المستخدم غير صالح")
        .toLowerCase(),
}).strict();

// 3. Comment Schema
export const commentSchema = z.object({
    content: z.string()
        .min(1, "التعليق فارغ")
        .max(2000, "التعليق طويل جدًا")
        .transform(sanitize),
    parentId: z.string().optional(),
    contentSlug: z.string().min(1),
}).strict();

// 4. Password Reset Schema
export const passwordResetSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8, "كلمة السر قصيرة جدًا").max(100),
}).strict();