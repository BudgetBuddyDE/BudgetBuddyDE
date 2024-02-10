import {type TRole} from '@budgetbuddyde/types';
// import {listen} from '../server';
// import Pool from '../database';
import {faker} from '@faker-js/faker';

// afterAll(done => {
//   listen.close(async error => {
//     if (error) console.error(error);
//     await Pool.end();
//     done();
//   });
// });

export const MOCK_ROLE: Record<string, Pick<TRole, 'name'>> = {
  user: {name: 'User'},
  admin: {name: 'Admin'},
};

export const MOCK_USER = {
  user: {uuid: 'demo-user-uuid', role: MOCK_ROLE.user, password: faker.internet.password()},
  empty_user: {uuid: 'empty-demo-user-uuid', role: MOCK_ROLE.user, password: faker.internet.password()},
  admin_user: {uuid: 'demo-admin-uuid', role: MOCK_ROLE.admin, password: faker.internet.password()},
};

describe('uses correct server setup', () => {
  it('should use the correct port', () => {
    expect(process.env.PORT).toBe('7070');
  });
});
