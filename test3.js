/**
 * Model file to handle all repository actions
 */
const { repoSchema, tempRepoSchema } = require('../schema/index');
const { Logger, DB } = require('../helpers/index');
const path = require('path');

/**
 * Get Repo model from ORM
 *
 * @async
 * @function GetRepoModel
 * @params {string} - org
 * @params {boolean} - schedulerEnabled
 * @returns {object}
 * @author dev-team
 */

const GetRepoModel = async (org = null, schedulerEnabled = true) => {
  try {
    const model = schedulerEnabled ? { name: 'Repo', schema: repoSchema } : { name: 'TempRepo', schema: tempRepoSchema };
    Logger.log('info', `Connecting ${model.name} model`);
    return await DB.GetCollectionModel(org, model.name, model.schema);
  } catch (exc) {
    Logger.log('error', `Error in GetRepoModel in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 *  Update Repository based on hooks delivery
 *
 * @async
 * @function UpdateRepository
 * @params {object}
 * @returns {object} - array of objects
 * @author dev-team
 */

const UpdateRepository = async params => {
  try {
    const { RepoModel, query, update, options, deliveryQ, updateHookDelivery } = params;
    const res = await RepoModel.updateOne(query, update, options);

    if (res) {
      if (deliveryQ && updateHookDelivery) updateHookDelivery(deliveryQ);
    } else Logger.log('error', JSON.stringify(res));

    return res;
  } catch (exc) {
    Logger.log('error', `Error in UpdateRepository in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Failed redeliveries bulk delete in db
 *
 * @async
 * @function DeleteRepository
 * @params {object}
 * @returns {object}
 * @author dev-team
 */

const DeleteRepository = async params => {
  try {
    const { RepoModel, query, deliveryQ, updateHookDelivery } = params;
    const res = await RepoModel.deleteOne(query);
    if (res) {
      if (deliveryQ && updateHookDelivery) updateHookDelivery(deliveryQ);
    } else {
      Logger.log('error', JSON.stringify(res));
    }
    return res;
  } catch (exc) {
    Logger.log('error', `Error in DeleteRepository in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Failed redeliveries bulk delete in db
 *
 * @async
 * @function AddOrModifiyRepoInDB
 * @params {object}
 * @returns {object} - array of objects
 * @author dev-team
 */

const AddOrModifiyRepoInDB = async params => {
  try {
    const { action, listObj, deliveryQ, setOrgPaginateAndOnboard, schedulerEnabled, updateHookDelivery, getCommitsFromDB } = params;
    const {
      delivery: { org, orgId }
    } = deliveryQ;

    const RepoModel = await GetRepoModel(org, schedulerEnabled);

    const { repo_name: name, repo_id: id } = listObj;
    Logger.log('info', `add or update repository from hooks : ${name}`);
    const query = { repo_id: id };

    const updateParams = { RepoModel, deliveryQ, updateHookDelivery };
    if (action === 'deleted') {
      const res = await DeleteRepository({ ...updateParams, query });
      return res;
    }

    if (action !== 'created') {
      // get commits data for the repo and update created at based on commits
      const [commit] = await getCommitsFromDB({ orgName: org, repoId: id, repoName: name });
      if (commit && new Date(commit.date) < new Date(listObj.created_at)) listObj.created_at = commit.date;
    }

    const res = await UpdateRepository({ ...updateParams, query, update: listObj, options: { upsert: true, setDefaultsOnInsert: true } });
    if (res && action === 'created') await setOrgPaginateAndOnboard({ orgId });
    return res;
  } catch (exc) {
    Logger.log('error', `Error in AddOrModifiyRepoInDB in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Update repository updated_at from hooks
 *
 * @async
 * @function SetRepoUpdateAtInDB
 * @params {object}
 * @returns {object} - array of objects
 * @author dev-team
 */

const SetRepoUpdateAtInDB = async params => {
  try {
    Logger.log('info', `Update repository updated_at from hooks`);
    const { id, updateAt, org } = params;

    const RepoModel = await GetRepoModel(org);

    const query = { repo_id: id };

    const repo = await RepoModel.findOne(query);
    if (!repo) {
      Logger.log('info', `Update repository updated_at from hook rebo ${id} not found`);
      return;
    }

    const update = { $set: { updated_at: updateAt } };
    await RepoModel.updateOne(query, update, { upsert: false });
    return;
  } catch (exc) {
    Logger.log('error', `Error in SetRepoUpdateAtInDB in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * Check repo deleted or not in hooks
 *
 * @async
 * @function GetIsRepoDeletedInDB
 * @params {object}
 * @returns {object}
 * @author dev-team
 */

const GetIsRepoDeletedInDB = async params => {
  try {
    Logger.log('info', `Check repo deleted or not in hooks`);
    const { orgName, repoId } = params;

    const RepoModel = await GetRepoModel(orgName);

    const query = { repo_id: repoId };

    const res = await RepoModel.findOne(query, { _id: 0, deleted: 1 });
    return res ? res.deleted : res;
  } catch (exc) {
    Logger.log('error', `Error in GetIsRepoDeletedInDB in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

module.exports = {
  AddOrModifiyRepoInDB,
  SetRepoUpdateAtInDB,
  GetIsRepoDeletedInDB
};
