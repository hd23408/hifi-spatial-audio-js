import { TestClass } from "./TestClass";

describe('Testing async calls', () => {

     describe('Tests with before and after', () => {

        beforeEach(async (done) => {
            console.log("beforeEach");
            done();
        });

        afterEach(async (done) => {
            console.log("afterEach");
            done();
        });

        describe('testing', () => {

        /*
            test('await a simple promise.resolve', async (done) => {
                  console.log("This test will show the beforeEach and afterEach logging.");
                  const value = await Promise.resolve(true);
                  expect(value).toBe(true);
                  done();

            });
            */
            test('await a resolve', async () => {

                  console.log("This test will only show the beforeEach logging.");
                  const testClass = new TestClass();
                  const value = await testClass.resolveToTrueAfter2Seconds();
                  console.log("This will not be output.");
                  // However, this 'expect' does appropriately check 
                  expect(testClass.myBool).toBe(true);
            });

        });
    });

});
