const noCacheMiddleware = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    next();
  };

  module.exports = { noCacheMiddleware }