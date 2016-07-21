export default class ExceptionHandlerService {

    static validate(err) {
        if (err) {
            throw new Error("Cause: " + err);
        }
    }

    static assertNotNull(obj) {
        if (obj == null) {
            throw new Error("Object " + obj + " can't be null!");
        }
    }
}