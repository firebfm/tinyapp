const getUserByEmail = function(email, database) {
  const keys = Object.keys(database)
  for (const user of keys) {
    if (database[user].email === email) {
      return user;
    }
  }
  return undefined;
};

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
};

module.exports = {
  getUserByEmail,
  generateRandomString
};