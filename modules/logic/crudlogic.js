const { Sequelize, Model, DataTypes } = require('sequelize');
const { Op } = require("sequelize");


class CrudLogic {

    static getModel()
    {
        return null;
    }
    
    static getPk(){
        return "id";
    }

    static totalData(search)
    {

    }

    static async create(o)
    {
        const CurrentModel = this.getModel();

        let result = this.validateCreate(o);
        if(result.success){
            try {
                o = this.initCreate(o);
                let newO = await CurrentModel.create(o);
                result.payload = newO;
                return  result;
            }
            catch(error)
            {
                throw { success: false, message: '', error: error };
            }
            
        }
        else
        {
            throw result
        }

    }

    static initCreate(o)
    {
        return o;
    }

    static initUpdate(o)
    {
        return o;
    }

    static initSelect()
    {

    }

    static async findAll(where=null, offset=null, limit=null,  order=null)
    {
        try{
            this.initSelect();
            const CurrentModel = this.getModel();
            
            let opt = {};
            if(offset != null)
                opt.offset = offset;
            
            if(limit != null)
                opt.limit = limit;

            if(order != null)
                opt.order = order;
            else
            {
                order = this.getOrder();
                if(order != null)
                    opt.order = order;
            }

            let defaultWhere =  this.getDefaultWhere();
            if(defaultWhere != null)
                opt.where = defaultWhere;

            let includes = this.getModelIncludes();
            if(includes != null)
                opt.include = includes;

            if(where != null)
                opt.where = {[Op.and]: [
                    opt.where,
                    where 
            ]}


            let os  = await CurrentModel.findAndCountAll(opt)
            return { success: true, payload: os }
        }
        catch (error)
        {
            throw { success: false, message: '', error: error };
        }
    }

 

    static async findByKeyword(search, offset=null, limit=null)
    {
        let where = this.getWhere(search);
        let order = this.getOrder();
        try {
            let result = await this.findAll(where, offset, limit, order);
            return result
        }
        catch(error)
        {
            throw { success: false, message: '', error: error };
        }
        
    }

    static async get(id)
    {
        try{
            const CurrentModel = this.getModel();
            let o  = await CurrentModel.findByPk(id);
            return { success: true, payload: o }
        }
        catch (error)
        {
            throw { success: false, message: '', error: error };
        }
    }

    static async update(id,  o)
    {
        o = this.initUpdate(o)
        let result = this.validateUpdate(o);
        let pk = this.getPk();
        if(result.success){
            try {
                const CurrentModel = this.getModel();
                let where = {};
                where[pk] = id;

                console.log(o)
                let newO = await CurrentModel.update(o, { where:  where  });
                result.payload = newO;
                return  result;
            }
            catch(error)
            {
                console.log("update.error")
                //console.log(error)
                throw { success: false, message: '', error: error };
            }
            
        }
        else
        {
            throw result
        }

    }

    static async delete(id)
    {
        try{
            let pk = this.getPk();
            const CurrentModel = this.getModel();
            let where = {};
            where[pk] = id;

            let result = await CurrentModel.destroy({ where: where });
            return { success: true, payload: result }
        }
        catch (error)
        {
            throw { success: false, message: '', error: error };
        }
    }

    static validateCreate(o){
        
        return {success :  true, message: "Succesfull"}
    }

    static validateUpdate(o)
    {   
        return {success :  true, message: "Succesfull"}
    }


    static getOrder()
    {
        return null;
    }

    static getDefaultWhere()
    {
        return null;
    }

    static getModelIncludes()
    {
        return null;
    }
}

module.exports = CrudLogic;