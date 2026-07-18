/**
 * Recursively removes any keys starting with '$' or containing '.' from the given object
 * to prevent NoSQL injection attacks. Modifies the object IN PLACE to be compatible
 * with Express 5 where req.query is a read-only getter.
 */
const sanitizeObject = (obj) => {
  if (Array.isArray(obj)) {
    obj.forEach(sanitizeObject);
  } else if (typeof obj === "object" && obj !== null) {
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

const mongoSanitize = () => {
  return (req, res, next) => {
    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    next();
  };
};

export default mongoSanitize;
