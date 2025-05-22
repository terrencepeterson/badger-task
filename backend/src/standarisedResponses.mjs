export const unauthenticated = {
    messaage: "Access denied please login",
    code: 401,
    redirect: true,
    url: "/login"
}

export const loggedOut = {
    message: "Logged out",
    redirect: true,
    code: 200,
    url: "/login"
}

export const unauthorised = {
    messaage: "Unauthorised - you don't have the correct permissions to access this resource",
    code: 403,
}

