export default class EndpointError extends Error {
    static generalErrorId = 'general'
    static validationErrorId = 'fields'
    static mixedErrorId = 'mixed'

    constructor({ message, type, redirectUrl, fields }) {
        super(message);
        this.name = "EndpointError";
        this.redirectUrl = redirectUrl
        this.type = type
        this.fields = fields
    }

    generateErrorRes() {
        const errorResConfig = { error: { type: this.type } }

        if (this.message) {
            errorResConfig.error.message = this.message
        }

        if (this.fields) {
            errorResConfig.error.fields = this.fields
        }

        if (this.redirectUrl) {
            errorResConfig.redirectUrl = this.redirectUrl
        }

        return errorResConfig
    }
}

