import * as adobe from '@adobe/aio-sdk';
async function main(params) {
  const logger = adobe.Core.Logger('main', { level: 'info' });

  try {
    logger.info('Adobe App Builder Action Invoked');

    // Example: Fetch data from Yozen Backend
    // const response = await fetch('https://api.yozen.com/v1/data');

    return {
      statusCode: 200,
      body: {
        message: 'Hello from Adobe App Builder!',
        params: params,
      },
    };
  } catch (error) {
    logger.error(error);
    return {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    };
  }
}

exports.main = main;
