export function generateRandomId() {
    const randomNumberArray = new Uint32Array(1)
    return crypto.getRandomValues(randomNumberArray)[0]
}

