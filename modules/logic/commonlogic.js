const CrudLogic = require("./crudlogic");

class CommonLogic extends CrudLogic {
    static getDefaultWhere()
    {
        let where = {
            organization_code: this.session.organization_code
        }

        return where;
    }
}

module.exports = CommonLogic;