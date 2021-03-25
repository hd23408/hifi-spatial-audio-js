export class TestClass {
    myBool :boolean;

      resolveToTrueAfter2Seconds() {
      this.myBool = false;
      console.log(this.myBool);
        return new Promise(resolve => {
          setTimeout(() => {
            this.myBool = true;
            console.log(this.myBool);
            resolve(true);
          }, 2000);
        });
      }

}
