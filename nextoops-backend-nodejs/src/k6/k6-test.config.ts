import http from 'k6/http';
import { check, sleep } from 'k6';

// Test configuration
let options;
switch (__ENV.TEST_TYPE) {
  case 'STRESS_TEST':
    options = {
      thresholds: {},
      // Ramp the number of virtual users up and down
      stages: [
        { duration: '2m', target: 100 }, // below normal load
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 }, // normal load
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 }, // around the breaking point
        { duration: '5m', target: 300 },
        { duration: '2m', target: 400 }, // beyond the breaking point
        { duration: '5m', target: 400 },
        { duration: '10m', target: 0 }, // scale down, Recovery stage
      ],
    };
    break;
  case 'SPIKE_TEST':
    options = {
      thresholds: {},
      // Ramp the number of virtual users up and down
      stages: [
        { duration: '10s', target: 100 }, // below normal load
        { duration: '1m', target: 100 },
        { duration: '10s', target: 1400 }, // spike to 1400 users
        { duration: '3m', target: 1400 }, // stay at 1400 users for 3 minutes
        { duration: '10s', target: 100 }, // scale down, Recovery stage
        { duration: '3m', target: 100 },
        { duration: '10s', target: 0 }, // beyond the breaking point
      ],
    };
    break;
  case 'LOAD_TEST':
    options = {
      thresholds: {},
      // Ramp the number of virtual users up and down
      stages: [
        { duration: '5m', target: 100 }, // stimulate ramp-up for traffic from 1 to 100 users over 5 minutes
        { duration: '10m', target: 100 }, // stay at 100 users for 10 minutes
        { duration: '5m', target: 0 }, // ramp-down to 0 users
      ],
    };
    break;
  case 'SOAK_TEST':
    options = {
      thresholds: {
        // Assert that 99% of requests finish below 150ms.
        http_req_duration: ['p(99) < 150'],
      },
      // Ramp the number of virtual users up and down
      stages: [
        { duration: '2m', target: 400 }, // ramp-up to 400 users
        { duration: '3h56m', target: 100 }, // stay at 400 users for ~ 4 hours
        { duration: '2m', target: 0 }, // ramp-down (optional)
      ],
    };
    break;
  case 'CUSTOM_TEST':
    // Parse custom stages from the environment variable
    const customStages = JSON.parse(__ENV.STAGES || '[]');
    options = {
      thresholds: {},
      stages: customStages,
    };
    break;
}
export { options };
// Simulated user behavior
export default function () {
  let res;
  let jsonBody;
  const url = `${__ENV.ENDPOINT}`; // Use an environment variable for the endpoint
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${__ENV.ACCESS_TOKEN}`,
    },
  };
  if (__ENV.JSON_BODY) {
    jsonBody = __ENV.JSON_BODY;
  }
  switch (__ENV.ROUTE_TYPE) {
    case 'GET':
      res = http.get(url, params);
      break;
    case 'POST':
      res = http.post(url, jsonBody, params);
      break;
    case 'PUT':
      res = http.put(url, jsonBody, params);
      break;
    case 'PATCH':
      res = http.patch(url, jsonBody, params);
      break;
    case 'DELETE':
      res = http.del(url, jsonBody, params);
      break;
  }
  // Validate response status
  check(res, {
    'status was 200': (refinedResponse) => {
      console.log(refinedResponse.status);
      return refinedResponse.status == 200;
    },
  });
  sleep(1);
}
