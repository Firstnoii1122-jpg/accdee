const RAILWAY_ENV_KEYS = [
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_ENVIRONMENT_NAME',
  'RAILWAY_PROJECT_ID',
  'RAILWAY_SERVICE_ID',
  'RAILWAY_DEPLOYMENT_ID',
];

function isRailwayRuntime() {
  return RAILWAY_ENV_KEYS.some((key) => Boolean(process.env[key]));
}

function isProductionRuntime() {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.FORCE_PRODUCTION_SECURITY === 'true' ||
    isRailwayRuntime()
  );
}

function getRuntimeEnvironment() {
  if (isProductionRuntime()) return 'production';
  return process.env.NODE_ENV || 'development';
}

module.exports = {
  getRuntimeEnvironment,
  isProductionRuntime,
  isRailwayRuntime,
};
