
function ServiceUnavailable(innerError) {
    this.innerError = innerError;
    this.name = "ServiceUnavailable";
}
Object.setPrototypeOf(ServiceUnavailable, Error);

function BadRequest(innerError) {
    this.innerError = innerError;
    this.name = "BadRequest";
}
Object.setPrototypeOf(BadRequest, Error);

module.exports = {
    ServiceUnavailable: ServiceUnavailable,
    BadRequest: BadRequest
};
