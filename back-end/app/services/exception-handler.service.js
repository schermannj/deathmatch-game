function ExceptionHandlerService() {
}

ExceptionHandlerService.prototype = {
    validate: validate,
    assertNotNull: assertNotNull
};

function validate(err) {
    if (err) {
        throw new Error("Cause: " + err);
    }
}

function assertNotNull(obj) {
    if (obj == null) {
        throw new Error("Object " + obj + " can't be null!");
    }
}

module.exports = ExceptionHandlerService;