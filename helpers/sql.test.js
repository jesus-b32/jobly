const { sqlForPartialUpdate } = require('./sql');


describe("sqlForPartialUpdate", function () {
    test("Partial Update", function () {
        const dataToUpdate = {"firstName": "Aliya", "age": 32};
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name",
            isAdmin: "is_admin"
        }

        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);

        expect(setCols).toEqual("\"first_name\"=$1, \"age\"=$2");
        expect(values).toEqual(expect.arrayContaining(['Aliya', 32]));
    });
});