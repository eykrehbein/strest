import { strestApi } from '../src/commands';

test('Strest API', () => {
	expect(strestApi('tests/success/two.strest.yaml', 'todoTwo', 'tests/strest_history.json', 'tests/strest_history.json')).toBe(0);
});
