import cds from '@sap/cds';

// FIXME: Retrieve list of allowed origins using environment variables or a configuration file
const ORIGINS = { 'http://localhost:3000': 1 };

cds.on('bootstrap', (app) => {
  // FIXME: This is a temporary solution, consider using a more robust CORS middleware in production
  app.use((req, res, next) => {
    if (req.headers.origin && req.headers.origin in ORIGINS) {
      res
        .set('Access-Control-Allow-Origin', req.headers.origin)
        .set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE')
        .set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        .set('Access-Control-Allow-Credentials', 'true');
      cds.log('cors').info(`CORS preflight request from ${req.headers.origin}`);
    }
    next();
  });
});
