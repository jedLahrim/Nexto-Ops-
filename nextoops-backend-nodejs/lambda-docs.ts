/**
 * 🚀 SERVERLESS FOR BEGINNERS (The "20-Year-Old Brain" Edition)
 *
 * Think of Serverless like "Pizza on Demand" instead of "Opening a Restaurant".
 *
 * --- THE CONCEPT ---
 * Traditionally, if you want to host an app, you "open a restaurant":
 * You pay rent (server cost), keep the lights on 24/7 (running idle),
 * and hire staff even when no one is eating.
 *
 * Serverless is like "Cloud Pizza":
 * The kitchen only turns on the oven when you call and order.
 * Once the pizza is delivered, the kitchen closes. You ONLY pay for the pizza.
 *
 * --- THE WORKFLOW (Step-by-Step) ---
 *
 * 1. THE TRIGGER (The Order) 📞
 *    Something happens to wake up the function.
 *    Maybe someone clicks a button on your website, uploads a photo to S3,
 *    or a timer goes off. In our `serverless.yml`, it's an HTTP POST request.
 *
 * 2. THE SPIN-UP (Turning on the Oven) 🔥
 *    AWS (the provider) sees the trigger and instantly creates a tiny "container"
 *    just to run your code. This happens in milliseconds (called a "Cold Start").
 *
 * 3. THE HANDLER (The Chef) 👨‍🍳
 *    This file! The `handler` function is the brain.
 *    It takes the `event` (data about the order) and the `context` (info about the kitchen),
 *    does the work (business logic), and returns a result.
 *
 * 4. THE SPIN-DOWN (Cleaning up) 🧹
 *    As soon as the function returns the `body`, AWS destroys the container.
 *    It stops billing you immediately. Your code is back to sleep.
 *
 * 5. SCALING (Feeding a Crowd) 🍕🍕🍕
 *    If 1,000 people order at the same time, AWS just opens 1,000 tiny kitchens
 *    simultaneously. You don't have to worry about the server crashing from "too much traffic".
 *
 * --- HOW TO RUN THIS ---
 * 1. Write the code (you are here).
 * 2. Deploy: `npx serverless deploy` (Uploads it to AWS).
 * 3. Invoke: Call the URL or use `npx serverless invoke -f hello`.
 *
 * --- FRONTEND TRIGGER EXAMPLE (The "Order") 📱 ---
 *
 * Imagine you have a "Surprise Me" button in your Flutter or React app:
 *
 * ```javascript
 * // When the user taps the button...
 * const triggerServerless = async () => {
 *   console.log("User clicked 'Surprise Me' - Sending order to the cloud!");
 *
 *   const response = await fetch('https://api.yozen.com/api/hello', {
 *     method: 'POST',
 *     body: JSON.stringify({ userId: 'user_123' })
 *   });
 *
 *   const data = await response.json();
 *   alert("Serverless says: " + data.message);
 * };
 * ```
 *
 * --- THE JOURNEY: HOW THE REQUEST "FLIES" TO AWS 🛸 ---
 *
 * 1. THE ADDRESS (DNS): Your app looks up `api.yozen.com` and finds the IP address of AWS's front door.
 * 2. THE FLIGHT: The request is broken into tiny packets and travels through your router, your ISP, and undersea cables at nearly the speed of light.
 * 3. THE FRONT DOOR (API Gateway): The request hits an "API Gateway" in the AWS region you chose. This is like a security guard who reads the "Order" and says, "Okay, this goes to the 'Hello' Chef."
 * 4. THE WAKE-UP CALL: API Gateway pokes the Lambda function (the code below) to start working.
 *
 * --- 🛠️ REALISTIC AWS SETUP GUIDE (STEP-BY-STEP) ---
 *
 * If you were to do this manually in the AWS Console instead of using the Serverless Framework:
 *
 * STEP 1: CREATE THE LAMBDA (The Logic) ⚙️
 * - Go to "Lambda" in AWS Console -> "Create Function".
 * - Choose "Node.js 20.x".
 * - Paste your compiled code from `dist/` into the editor (or upload a .zip).
 * - AWS gives this function a unique "ARN" (Amazon Resource Name).
 *
 * STEP 2: CREATE API GATEWAY (The HTTP Entry) 🌐
 * - Go to "API Gateway" -> "Create API" -> "HTTP API".
 * - Add an "Integration": Point it to the Lambda function you created in Step 1.
 * - Add a "Route": Set it to `POST /hello`.
 * - AWS gives you an ugly URL like `https://x7abc123.execute-api.us-east-1.amazonaws.com`.
 *
 * STEP 3: CUSTOM DOMAIN & DNS (The Brand) 🏷️
 * - Go to "Route 53" (AWS's Address Book).
 * - "Create Hosted Zone" for your domain (e.g., `yozen.com`).
 * - Go back to "API Gateway" -> "Custom Domain Names".
 * - Create `api.yozen.com` and link it to your API.
 * - Create a "CNAME" or "Alias" record in Route 53 pointing `api.yozen.com` to the API Gateway's internal address.
 *
 * STEP 4: PERMISSIONS (The Keys) 🔑
 * - AWS uses "IAM" (Identity & Access Management).
 * - You must add a "Resource-based policy" to your Lambda to allow API Gateway to invoke it.
 * - (The Serverless Framework does Step 1-4 for you automatically!)
 *
 * Flow: User clicks -> Route 53 (DNS) -> API Gateway -> IAM Check -> Lambda Handler Execution -> Response.
 */

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
