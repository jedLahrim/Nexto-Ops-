import { Callback, Context, Handler } from 'aws-lambda';

// todo This function can be triggered by S3 events, CloudWatch, or API Gateway.
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  console.log('Lambda executed with event:', JSON.stringify(event, null, 2));

  // Business logic for the Lambda function
  const responseData = {
    message: 'Hello from Yozen AWS Lambda!',
    timestamp: new Date().toISOString(),
    requestId: context.awsRequestId,
  };

  return {
    statusCode: 200,
    body: JSON.stringify(responseData),
  };
};
