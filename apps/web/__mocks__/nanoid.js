// Mock nanoid for Jest (ESM compatibility workaround)
let counter = 0;

function nanoid(size = 21) {
    counter++;
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${random}${counter}`.substring(0, size);
}

module.exports = { nanoid };
