import { validateType } from '../src/test';

test('Validate Types', () => {
  expect(validateType(['string'], 'A String')).toBe(true);
  expect(validateType(['string.hex'], '5361792048656c6c6f20746f204d79204c6974746c6520467269656e64')).toBe(true);
  expect(validateType(['string.email'], 'test@test.com')).toBe(true);
  expect(validateType(['string.ip'], '192.168.178.1')).toBe(true);
  expect(validateType(['string.uri'], 'https://localhost:3000/test')).toBe(true);
  expect(validateType(['string.url'], 'https://localhost:3000/test')).toBe(true);
  expect(validateType(['string.lowercase'], 'asdasd')).toBe(true);
  expect(validateType(['string.uppercase'], 'ASDASD')).toBe(true);
  expect(validateType(['string.base64'], 'YXNkYXNkYXNkYWRz')).toBe(true);
  
  expect(validateType(['bool'], true)).toBe(true);
  expect(validateType(['boolean'], false)).toBe(true);

  expect(validateType(['object'], {})).toBe(true);

  expect(validateType(['array'], [])).toBe(true);

  expect(validateType(['number'], 123)).toBe(true);
  expect(validateType(['number.positive'], 1)).toBe(true);
  expect(validateType(['number.negative'], -1)).toBe(true);

  expect(validateType(['null'], null)).toBe(true);
});