export default class ExceptionHandlerService {

    static validate(err) {
        if (err) {
            throw new Error("Cause: " + err);
        }
    }

    static assertNotNull(obj) {
        if (!obj) {
            throw new Error("Object " + obj + " can't be null!");
        }
    }
}