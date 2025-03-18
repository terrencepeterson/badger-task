import DOMPurify from "isomorphic-dompurify";

export function responseFormatter (req, res, next) {
    res.success = (data, metadata = {}) => {
        res.status(200).json({
            status: 'success',
            data,
            metadata
        });
    };

    res.error = (message, code = 400, details = {}) => {
        res.status(code).json({
            status: 'error',
            error: {
                code,
                message,
                details
            },
            metadata: {
                timestamp: new Date().toISOString(),
            }
        });
    };

    next();
};

export function sanitiseInput(req, res, next) {
    if (!req.body) {
        return
    }

    for (const key in req.body) {
        req.body[key] = DOMPurify.sanitize(req.body[key])
    }

    next()
}

