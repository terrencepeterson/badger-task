// creates an async wrapper around an endpoint
// instead of having the below in all endpoints
//try {
//    do whatever the endpoint needs to do
//    res.success(data)
//} catch (e) {
//    console.log(e)
//    res.error(e.message)
//}
export function createEndpoint(getData) {
    return async (req, res) => {
        try {
            const data = await getData(req, res)

            if (typeof data === 'object') {
                const successMessage = data.message 
                delete data.message
                res.success(successMessage, data)
                return
            }

            res.success(data)
        } catch (e) {
            console.log(e)
            res.error(e.message)
        }
    }
}
