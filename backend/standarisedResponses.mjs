export const unauthenticated = {
    messaage: "Access denied please login",
    code: 401,
    details: {
        redirect: true,
        url: "/login"
    }
}

export const loggedOut = {
    message: "Logged out",
    metaData: {
        redirect: true,
        url: "/login"
    }
}

