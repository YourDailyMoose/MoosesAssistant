 const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { DateTime } = require('luxon');

let db;

async function connectDatabase(uri) {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  await client.connect();
  db = client.db('moosesassistant');
}

function getDB() {
  return db;
}

async function addWarning(guildId, userTag, userId, moderatorId, reason) {
  const db = getDB();
  const warnings = db.collection('punishments');

  const warningData = {

    guildId,
    userTag,
    userId,
    moderatorId,
    reason,
    timestamp: new Date(),
  };

  const result = await warnings.insertOne(warningData);
  return result.insertedId; // This returns the ObjectID of the inserted warning.
}



async function getWarnings(userId, guildId = null) {
  const db = getDB();
  const warnings = db.collection('punishments');

  const query = { userId };
  if (guildId) {
    query.guildId = guildId;
  }

  return await warnings.find(query).toArray();
}


async function deleteWarning(punishmentId) {
  try {
    const db = getDB();
    const warnings = db.collection('punishments');

    console.log(punishmentId);

    const query = { _id: new ObjectId(punishmentId) };

    const result = await warnings.deleteOne(query);

    if (result.deletedCount === 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error deleting warning:", error);
    return false;
  }
}



async function blacklistUser(userId, userTag, reason, moderator, dateTime) {
  try {
    const collection = db.collection("blacklists");

    const existingEntry = await collection.findOne({ UserId: userId });

    if (!existingEntry) {
      await collection.insertOne({
        UserId: userId,
        UserTag: userTag,
        Reason: reason,
        Moderator: moderator,
        DateTime: dateTime,
        Active: true
      });
      return "blacklisted";
    } else if (existingEntry.Active) {
      return "already_blacklisted";
    } else {
      await collection.updateOne(
        { UserId: userId },
        {
          $set: {
            Active: true,
            Reason: reason,
            Moderator: moderator,
            DateTime: dateTime
          }
        }
      );
      return "reactivated";
    }
  } catch (err) {
    console.error("Error blacklisting user:", err);
    return "error";
  }
}

async function isUserBlacklisted(userId) {
  try {
    const collection = db.collection("blacklists");
    const query = { UserId: userId, Active: true };
    const blacklistedUser = await collection.findOne(query);
    return blacklistedUser;
  } catch (err) {
    console.error("Error checking if user is blacklisted:", err);
    return null;
  }
}

async function getBlacklistedUsers() {
  try {
    const collection = db.collection("blacklists");
    return await collection.find({}).toArray();
  } catch (error) {
    console.error("Error fetching blacklisted users:", error);
    throw error;
  }
}

async function unblacklistUser(userId) {
  try {
    const collection = db.collection("blacklists");
    const query = { UserId: userId, Active: true };
    const update = { $set: { Active: false } };

    const result = await collection.updateOne(query, update);

    return result.modifiedCount > 0 ? 'unblacklisted' : 'not_blacklisted';
  } catch (error) {
    console.error("Error unblacklisting user:", error);
    return 'error';
  }
}

async function eraseBlacklist(userId) {
  try {
    const collection = db.collection("blacklists");
    const result = await collection.deleteOne({ UserId: userId });
    return result.deletedCount > 0 ? 'erased' : 'not_found';
  } catch (error) {
    console.error("Error erasing blacklist:", error);
    return 'error';
  }
}

// Guild-based leveling functions
async function addGuildXP(guildId, userId, xpToAdd) {
  const collection = db.collection('guild_levels');
  await collection.updateOne(
    { guildId, userId },
    { $inc: { xp: xpToAdd } },
    { upsert: true }
  );
}

async function getGuildLevel(guildId, userId) {
  const collection = db.collection('guild_levels');
  return await collection.findOne({ guildId, userId });
}

// Global leveling functions
async function addGlobalXP(userId, xpToAdd) {
  const collection = db.collection('global_levels');
  await collection.updateOne(
    { userId },
    { $inc: { xp: xpToAdd } },
    { upsert: true }
  );
}

async function getGlobalLevel(userId) {
  const collection = db.collection('global_levels');
  return await collection.findOne({ userId });
}


//NEW FUNCTIONS

async function addPunishment(punishmentType, userId, moderatorId, reason, guildId) {
  const db = getDB();
  const punishments = db.collection('punishments');

  const sydneyTime = DateTime.now().setZone("Australia/Sydney");

  const entryData = {
    punishmentType,
    guildId,
    userId,
    moderatorId,
    reason,
    active: true,
    timestamp: sydneyTime.toJSDate()  // This will be the current time in the Australia/Sydney timezone
  };

  const result = await punishments.insertOne(entryData);
  return result.insertedId;
}

async function deletePunishment(punishmentId) {
  try {
    const db = getDB();
    const punishments = db.collection('punishments');

    // Convert string ID to ObjectID
    const objectId = new ObjectId(punishmentId);

    // Find the punishment first to check its 'active' status
    const punishment = await punishments.findOne({ _id: objectId });

    // If the punishment doesn't exist, return "not-found"
    if (!punishment) {
      return "not-found";
    }

    // If the punishment is already inactive, return "not-active"
    if (!punishment.active) {
      return "not-active";
    }

    // Otherwise, update the 'active' property to false
    const result = await punishments.updateOne({ _id: objectId }, { $set: { active: false } });

    // Return "deleted" if the punishment was updated, otherwise "failed"
    return result.modifiedCount > 0 ? "deleted" : "failed";
  } catch (error) {
    console.error("Error updating punishment:", error);
    throw error;
  }


}

async function fetchModlogs(userId, scope, guildId) {
  const db = getDB();
  const punishments = db.collection('punishments');

  let query = { userId: userId };

  if (scope === 'guild') {
    
    query.guildId = guildId;
  }

  return await punishments.find(query).toArray();
}

async function addGuildBlacklist(guildId, guildName, moderatorId, reason) {
  try {
    const collection = db.collection("guildblacklists");

    const existingEntry = await collection.findOne({ GuildId: guildId });

    const dateTime = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney', hour12: true });

    if (!existingEntry) {
      await collection.insertOne({
        GuildId: guildId,
        GuildName: guildName,
        Reason: reason,
        Moderator: moderatorId,
        DateTime: dateTime,
        Active: true
      });
      return "blacklisted";
    } else if (existingEntry.Active) {
      return "already_blacklisted";
    } else {
      await collection.updateOne(
        { UserId: userId },
        {
          $set: {
            Active: true,
            Reason: reason,
            Moderator: moderator,
            DateTime: dateTime
          }
        }
      );
      return "reactivated";
    }
  } catch (err) {
    console.error("Error blacklisting user:", err);
    return "error";
  }
}





module.exports = {
  connectDatabase,
  getDB,
  addWarning,
  getWarnings,
  deleteWarning,
  blacklistUser,
  isUserBlacklisted,
  getBlacklistedUsers,
  unblacklistUser,
  eraseBlacklist,
  getGuildLevel,
  addGuildXP,
  getGlobalLevel,
  addGlobalXP,

  ///// new functions

  addPunishment,
  deletePunishment,
  fetchModlogs,
  addGuildBlacklist,
};

