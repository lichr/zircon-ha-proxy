export class HaRequest {
  id: number;
  requestData: any;
  responseData: any;
  promise: Promise<any>;
  resolve: (value: any) => void = () => {};
  reject: (reason?: any) => void = () => {};

  constructor(id: number, requestData: any) {
    this.id = id;
    this.requestData = requestData;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}
