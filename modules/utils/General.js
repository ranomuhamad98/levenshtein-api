var randomstring = require("randomstring");
var moment = require("moment")

class General 
{
    static randomString(length)
    {
        return randomstring.generate(length);
    }

    static getCurrentDate(format)
    {
        
        return moment().format(format);  
    }

    static getTimeZone()
    {

        return moment().utcOffset()/60;
    }

    static getTimeDifference(time1, time2, info)
    {
        var duration = moment.duration(moment(time2).diff(moment(time1)));
        let difference = 0;
        switch(info)
        {
            case "h":
                difference = duration.asHours();
            break;
            case "m":
                difference = duration.asMinutes();
            break;
            case "s":
                difference = duration.asSeconds();
            break;
            case "M":
                difference = duration.asMonths();
            break;
            case "D":
                difference = duration.asDays();
            break;
            case "Y":
                difference = duration.asYears();
            break;
        }
        return difference;
    }
}

module.exports = General;