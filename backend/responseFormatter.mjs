export default function responseFormatter (req, res, next) {
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

