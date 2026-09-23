import * as readline from 'readline';
import { spawn, StdioPipeNamed } from 'child_process';
import * as process from 'process';
import * as proc from 'process';
import inquirer, { Answers } from 'inquirer';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const rl = readline.createInterface(process.stdin, process.stdout);
const testTypes = ['STRESS_TEST', 'SPIKE_TEST', 'LOAD_TEST', 'SOAK_TEST', 'CUSTOM_TEST'];
const routeTypes = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

rl.question('Please provide the ENDPOINT (URL): ', (endpoint) => {
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'selectedTestType',
        message: 'Select the test type:',
        choices: testTypes,
      },
    ])
    .then((answers: { selectedTestType: string }) => {
      const selectedTestType = answers.selectedTestType;
      if (selectedTestType === 'CUSTOM_TEST') {
        return inquirer
          .prompt([
            {
              type: 'number',
              name: 'stageCount',
              message: 'How many stages do you want in your custom test?',
              validate: (input: number) => input > 0 || 'Please enter a number greater than 0',
            },
          ])
          .then((stageAnswer: { stageCount: number }) => ({
            selectedTestType,
            stageCount: stageAnswer.stageCount,
          }));
      }
      return { selectedTestType, stageCount: 0 };
    })
    .then(({ selectedTestType, stageCount }) => {
      if (selectedTestType === 'CUSTOM_TEST') {
        const stagePrompts = [];
        for (let i = 0; i < stageCount; i++) {
          stagePrompts.push(
            {
              type: 'input',
              name: `stage${i}Duration`,
              message: `Enter duration for stage ${i + 1} (e.g., '1m', '30s'):`,
            },
            {
              type: 'number',
              name: `stage${i}Target`,
              message: `Enter target number of users for stage ${i + 1}:`,
            },
          );
        }
        return inquirer.prompt(stagePrompts).then((stageAnswers) => ({
          selectedTestType,
          stageAnswers,
        }));
      }
      return { selectedTestType, stageAnswers: null };
    })
    .then(({ selectedTestType, stageAnswers }) => {
      return inquirer
        .prompt([
          {
            type: 'list',
            name: 'selectedRouteType',
            message: 'Select the route type:',
            choices: routeTypes,
          },
        ])
        .then((routeAnswer: { selectedRouteType: string }) => ({
          selectedTestType,
          selectedRouteType: routeAnswer.selectedRouteType,
          stageAnswers,
        }));
    })
    .then(({ selectedTestType, selectedRouteType, stageAnswers }) => {
      return inquirer
        .prompt([
          {
            type: 'confirm',
            name: 'hasJsonBody',
            message: 'Does the request have a JSON body?',
            default: false,
          },
          {
            type: 'editor',
            name: 'jsonBody',
            message:
              'Enter the JSON body in the editor:\n\n' +
              "# For Linux and MacOS users, type ':wq' and press 'Enter' to save and exit.\n" +
              "# For Windows users, press 'Ctrl+Z' and then 'Enter' to save and exit.\n" +
              '# Please provide a valid JSON object below.\n',
            when: (answers: { hasJsonBody: boolean }) => answers.hasJsonBody,
            validate: (input: string) => {
              try {
                JSON.parse(input);
                return true;
              } catch (e) {
                return 'Please provide a valid JSON string.';
              }
            },
          },
        ] as Answers)
        .then((jsonAnswer: { hasJsonBody: boolean; jsonBody: string }) => ({
          selectedTestType,
          selectedRouteType,
          stageAnswers,
          jsonBody: jsonAnswer.hasJsonBody ? jsonAnswer.jsonBody : '',
        }));
    })
    .then(({ selectedTestType, selectedRouteType, stageAnswers, jsonBody }) => {
      const filePath = 'src/k6/k6-test.config.ts';
      const command = 'k6';
      if (!proc.env.ACCESS_TOKEN) {
        console.error('ACCESS_TOKEN is required in your .env file');
        proc.exit(1);
      }
      const args = [
        'run',
        `${filePath}`,
        '--env',
        `ENDPOINT=${endpoint}`,
        '--env',
        `TEST_TYPE=${selectedTestType}`,
        '--env',
        `ROUTE_TYPE=${selectedRouteType}`,
        '--env',
        `ACCESS_TOKEN=${proc.env.ACCESS_TOKEN}`,
      ];
      if (jsonBody) {
        args.push('--env', `JSON_BODY=${jsonBody}`);
      }
      if (selectedTestType === 'CUSTOM_TEST' && stageAnswers) {
        const customStages = Object.keys(stageAnswers).reduce((acc, key, index) => {
          if (index % 2 === 0) {
            acc.push({
              duration: stageAnswers[key],
              target: stageAnswers[`stage${index / 2}Target`],
            });
          }
          return acc;
        }, []);
        args.push('--env', `CUSTOM_STAGES=${JSON.stringify(customStages)}`);
      }
      console.log(`\nRunning: ${command} ${args.join(' ')}`);
      const process = spawn(command, args, { stdio: 'inherit' as StdioPipeNamed });
      process.on('close', (code) => {
        console.log(`k6 process exited with code ${code}`);
        rl.close();
      });
    })
    .catch((error) => {
      console.error('An error occurred while selecting the test type, route type, or providing the JSON body:', error);
      rl.close();
    });
});
