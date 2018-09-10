import { spawnSync } from 'child_process';
import * as path from 'path';

test('Strest Command Line', async () => {
  const successRequest = spawnSync('node', ['dist/main.js', 'tests/success/successRequests1.strest.yaml'])  
  const bundledSuccessRequest = spawnSync('node', ['dist/main.js', 'tests/success'])

  // HTTP Error
  const failureRequest1 = spawnSync('node', ['dist/main.js', 'tests/failure/failureRequest1.strest.yaml'])
  // Validation Error
  const failureRequest2 = spawnSync('node', ['dist/main.js', 'tests/failure/failureRequest1.strest.yaml'])


  expect(successRequest.status).toBe(0);
  expect(bundledSuccessRequest.status).toBe(0);

  expect(failureRequest1.status).toBe(1);
  expect(failureRequest2.status).toBe(1);
})