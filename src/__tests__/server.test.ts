// afterAll(done => {
//   listen.close(async error => {
//     if (error) console.error(error);
//     await Pool.end();
//     done();
//   });
// });

describe('uses correct server setup', () => {
  it('should use the correct port', () => {
    expect(process.env.PORT).toBe('7070');
  });
});
