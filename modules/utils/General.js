var randomstring = require("randomstring");

class General 
{
    static randomString(length)
    {
        return randomstring.generate(length);
    }
}

module.exports = General;