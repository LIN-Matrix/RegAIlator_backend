const httpStatus = require('http-status');
const { Material } = require('../models');
const ApiError = require('../utils/ApiError');
const { subUserRoles } = require('../configs/roles');


const queryBillOfMaterials = async (filter, options) => {
    return Material.paginate(filter, options);
};

const createBillOfMaterial = async (userId, materialBody) => {
    // if (await Material.isMaterialNameTaken(materialBody.materialName)) {
    //     throw new ApiError(httpStatus.BAD_REQUEST, 'Material Name already taken');
    // }
    materialBody.user = userId;
    return Material.create(materialBody);
}

const createBillOfMaterialsBatch = async (userId, materialBody) => {
    for (let i = 0; i < materialBody.length; i++) {
        // if (await Material.isMaterialNameTaken(materialBody[i].materialName)) {
        //     throw new ApiError(httpStatus.BAD_REQUEST, 'Material Name already taken');
        // }
        materialBody[i].user = userId;
    }
    return Material.insertMany(materialBody);
}

module.exports = {
    queryBillOfMaterials,
    createBillOfMaterial,
    createBillOfMaterialsBatch
};
