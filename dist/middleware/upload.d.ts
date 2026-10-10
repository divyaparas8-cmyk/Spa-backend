/**
 * OMEGA SPA POS — Multer Upload Middleware
 * Phase 23: Media Storage Integration
 *
 * Handles multipart/form-data file uploads with:
 * - Memory storage (buffer — no local disk)
 * - MIME type validation (jpg, jpeg, png, webp)
 * - File size limit (5MB)
 * - Rejection of unsafe file types
 */
/**
 * Single image upload middleware
 * Field name: 'image'
 */
export declare const uploadSingle: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Multiple images upload middleware for cleaning proofs
 * Accepts 'images' (up to 10) or fallback 'image' (1)
 */
export declare const uploadCleaningProof: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Social media photo/video upload middleware (supports up to 10 files)
 */
export declare const uploadSocialMedia: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
/**
 * Error handler wrapper for multer errors
 */
export declare const handleMulterError: (err: any) => string;
//# sourceMappingURL=upload.d.ts.map