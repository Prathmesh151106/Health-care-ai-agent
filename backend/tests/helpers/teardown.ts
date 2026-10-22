/**
 * tests/helpers/teardown.ts
 * Jest global teardown: close the database pool after all tests.
 */

module.exports = async () => {
  try {
    // The pool module may not have been loaded in all test runs
    const { closePgPool } = require('../../src/db/pool');
    await closePgPool();
  } catch {
    // ignore – pool may not be initialised
  }
};
