const { BadRequestError } = require("../expressError");


/**Used to make partial or full update queries by creating the SET clause of an SQL UPDATE statement.
 * The dataToUpdate determnes what values go in the SET clause.
 * This allows the SET clause to dynamically change based on what values a user wants to update
 * 
 * @param {Object} dataToUpdate object that has the data a user wants to update. Comes from req.body
 * @param {Object} jsToSql maps datafield names in JS to the table column names of database. EX:         
 * {
    firstName: "first_name",
    lastName: "last_name",
    isAdmin: "is_admin",
  }
 * @returns {Object} {sqlColumns, dataToUpdate}
 */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
