/**
 * Model file to handle all the database connection logis
 */
const { repoSchema } = require('../schema/index');
const { Logger, db } = require('../helpers/index');
const path = require('path');

/**
 * get repo data from db
 *
 * @async
 * @function GetRepoListFromDB
 * @param {object} query
 * @param {string} orgName
 * @returns {object} - array of objects
 * @author dev-team
 */

const GetRepoListFromDB = async (query, orgName) => {
  try {
    Logger.log('info', `Get repositories list from DB for Repository`);
    const repo = await db.GetCollectionModel(orgName, 'Repo', repoSchema);
    const response = await repo.find(query).lean();
    return response;
  } catch (exc) {
    Logger.log('error', `Error in GetRepoListFromDB in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

/**
 * set repo data to db
 *
 * @async
 * @function SetRepoListToDB
 * @param {object}
 * @author dev-team
 */

const SetRepoListToDB = async (repoList, orgName) => {
  try {
    Logger.log('info', `Updating latest repository list to repo collection`);
    const repo = await db.GetCollectionModel(orgName, 'Repo', repoSchema);
    repoList = repoList.map(objRepo => {
      objRepo.repo_id = objRepo.id;
      objRepo.repo_name = objRepo.name;
      delete objRepo.id;
      delete objRepo.name;
      return objRepo;
    });
    const bulkWriteQueries = repoList.reduce((acc, val) => {
      return [
        ...acc,
        {
          updateOne: {
            filter: { repo_id: val.repo_id },
            update: { $set: { ...val, repo_enabled: true, onboard_complete: false, paginate_complete: false } },
            upsert: true,
            setDefaultsOnInsert: true
          }
        }
      ];
    }, []);
    await repo.bulkWrite(bulkWriteQueries, {});
  } catch (exc) {
    Logger.log('error', `Error in SetRepoListToDB in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

const UpdateRepo = async (query, update, orgName) => {
  try {
    Logger.log('info', `Updating flag ${update} to repo collection ${query}`);
    const repo = await db.GetCollectionModel(orgName, 'Repo', repoSchema);
    repo.updateOne(query, update, { upsert: false }, err => {
      if (err) {
        Logger.log('error', err);
        throw err;
      }
    });
  } catch (exc) {
    Logger.log('error', `Error in UpdateRepo in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

const UpdateMultiRepo = async (repoList, orgName) => {
  try {
    Logger.log('info', `Updating latest repo details in repo collection`);
    const repo = await db.GetCollectionModel(orgName, 'Repo', repoSchema);
    const bulkWriteQueries = repoList.reduce((acc, repos) => {
      return [
        ...acc,
        {
          updateOne: {
            filter: { repo_id: repos.id },
            update: { $set: { repo_name: repos.name, size: repos.size, created_at: repos.created_at, updated_at: repos.updated_at, language: repos.language } },
            upsert: false
          }
        }
      ];
    }, []);
    await repo.bulkWrite(bulkWriteQueries, {});
  } catch (exc) {
    Logger.log('error', `Error in UpdateMultiRepo in ${path.basename(__filename)}: ${JSON.stringify(exc)}`);
    throw exc;
  }
};

module.exports = {
  GetRepoListFromDB,
  SetRepoListToDB,
  UpdateRepo,
  UpdateMultiRepo
};
