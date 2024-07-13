"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "new",
        salary: 95000,
        equity: '0',
        companyHandle: 'c1'
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            id: job.id,
            ...newJob
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
            FROM jobs
            WHERE id = $1`, [job.id]);
        expect(result.rows).toEqual([
        {
            id: job.id,
            title: "new",
            salary: 95000,
            equity: '0',
            company_handle: 'c1'
        },
        ]);
    });
});

/************************************** findAll */

describe("findAll", function () {
    test("works: no filter", async function () {
        const jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: 1,
                title: "j1",
                salary: 70000,
                equity: '0',
                companyHandle: 'c1'
            },
            {
                id: 2,
                title: "j2",
                salary: 100000,
                equity: '0.100',
                companyHandle: 'c2'
            },
            {
                id: 3,
                title: "j3",
                salary: 500000,
                equity: null,
                companyHandle: 'c3'
            }
        ]);
    });

    test('works: one filter', async function () {
        const filters = {
            title: 'j1'
        }
        const jobs = await Job.findAll(filters);
        expect(jobs).toEqual([
        {
            id: 1,
            title: "j1",
            salary: 70000,
            equity: '0',
            companyHandle: 'c1'
        }
        ]);
    });

    test('works: two filter', async function () {
        const filters = {
            title: 'j',
            minSalary: 85000
        }
        const jobs = await Job.findAll(filters);
        expect(jobs).toEqual([
            {
                id: 2,
                title: "j2",
                salary: 100000,
                equity: '0.100',
                companyHandle: 'c2'
            },
            {
                id: 3,
                title: "j3",
                salary: 500000,
                equity: null,
                companyHandle: 'c3'
            }
        ]);
    });

    test('works: three filter', async function () {
        const filters = {
            title: 'j',
            minSalary: 85000,
            hasEquity: true
        }
        const jobs = await Job.findAll(filters);
        expect(jobs).toEqual([
            {
                id: 2,
                title: "j2",
                salary: 100000,
                equity: '0.100',
                companyHandle: 'c2'
            },
        ]);
    });

    test('works: filter resulting in empty list', async function () {
        const filters = {
            title: 'none'
        }
        const jobs = await Job.findAll(filters);

        expect(jobs).toEqual([]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        const job = await Job.get(1);
        expect(job).toEqual({
            id: 1,
            title: "j1",
            salary: 70000,
            equity: '0',
            company: {
                handle: "c1",
                name: "C1",
                description: "Desc1",
                numEmployees: 1,
                logoUrl: "http://c1.img"
            }
        });
    });

    test("not found if no such job", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "updated",
        salary: 70000,
        equity: '0'
    };

    test("works", async function () {
        let job = await Job.update(1, updateData);
        expect(job).toEqual({
            id: 1,
            ...updateData,
            companyHandle: 'c1'
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
            FROM jobs
            WHERE id = 1`);
        expect(result.rows).toEqual([{
            id: 1,
            title: "updated",
            salary: 70000,
            equity: '0',
            company_handle: "c1"
        }]);
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: 'updated',
            salary: null,
            equity: null
        };

        const job = await Job.update(1, updateDataSetNulls);
        expect(job).toEqual({
            id: 1,
            ...updateDataSetNulls,
            companyHandle: 'c1'
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
            FROM jobs
            WHERE id = 1`);
        expect(result.rows).toEqual([{
            id: 1,
            title: "updated",
            salary: null,
            equity: null,
            company_handle: "c1"
        }]);
    });

    test("not found if no such job", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(1);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=1");
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});
