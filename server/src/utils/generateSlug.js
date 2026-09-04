import slugify from 'slugify';

/**
 * Generate URL-friendly slug
 * @param {string} text
 * @returns {string}
 */
export const generateSlug = (text) => {
  if (!text) return '';
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
};

export default generateSlug;
