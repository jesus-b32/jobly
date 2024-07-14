"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token, //isAdmin
    u2Token //isnotAdmin
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
    const newJob = {
        title: "new j1",
        salary: 500000,
        equity: "0",
        companyHandle: "c1"
    }
    test("ok for admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: 4,
                ...newJob
            }
        });
    });

    test("UnauthorizedError for non-admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: 500000,
                companyHandle: "c1"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: 1,
                salary: "500000",
                equity: null,
                companyHandle: "c1"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /companies */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
        jobs:
            [
                {
                    id: 1,
                    title: "j1",
                    salary: 75000,
                    equity: "0",
                    companyHandle: "c1"
                },
                {
                    id: 2,
                    title: "j2",
                    salary: 100000,
                    equity: "0.100",
                    companyHandle: "c2"
                },
                {
                    id: 3,
                    title: "j3",
                    salary: 200000,
                    equity: null,
                    companyHandle: "c3"
                },
            ],
        });
    });

    test("ok with one filter", async function () {
        const resp = await request(app).get("/jobs?title=j2");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: 2,
                        title: "j2",
                        salary: 100000,
                        equity: "0.100",
                        companyHandle: "c2"
                    }
                ]
        });
    });


    test("ok with two filters", async function () {
        const resp = await request(app).get("/jobs?title=j&minSalary=85000");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: 2,
                        title: "j2",
                        salary: 100000,
                        equity: "0.100",
                        companyHandle: "c2"
                    },
                    {
                        id: 3,
                        title: "j3",
                        salary: 200000,
                        equity: null,
                        companyHandle: "c3"
                    }
                ]
        });
    });

    test("ok with all filters", async function () {
        const resp = await request(app).get("/jobs?title=j&minSalary=85000&hasEquity=true");
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: 2,
                        title: "j2",
                        salary: 100000,
                        equity: "0.100",
                        companyHandle: "c2"
                    }
                ]
        });
    });

    // test("Bad request with minEmployees > maxEmployees", async function () {
    //     const resp = await request(app).get("/companies?minEmployees=3&maxEmployees=0");
    //     expect(resp.statusCode).toEqual(400);
    // });

    test("Bad request with invalid query parameters", async function () {
        const resp = await request(app).get("/jobs?bad=0");
        expect(resp.statusCode).toEqual(400);
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE companies CASCADE");
        const resp = await request(app)
            .get("/companies")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
    });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/1`);
        expect(resp.body).toEqual({
        job: {
            id: 1,
            title: "j1",
            salary: 75000,
            equity: "0",
            company: {
                handle: "c1",
                name: "C1",
                numEmployees: 1,
                description: "Desc1",
                logoUrl: "http://c1.img"
            }
        }
        });
    });

    // test("works for anon: company w/o jobs", async function () {
    //     const resp = await request(app).get(`/jobs/1`);
    //     expect(resp.body).toEqual({
    //     company: {
    //         handle: "c2",
    //         name: "C2",
    //         description: "Desc2",
    //         numEmployees: 2,
    //         logoUrl: "http://c2.img",
    //     },
    //     });
    // });

    test("not found for no such job", async function () {
        const resp = await request(app).get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /jobs/:id", function () {
    test("works for admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
            title: "j1-new",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({
            job: {
                id: 1,
                title: "j1-new",
                salary: 75000,
                equity: "0",
                companyHandle: "c1"
            },
        });
    });

    test("unauth for non-Admin user", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                title: "j1-new",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "new nope",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/2`)
            .send({
                title: "j2-new",
                badFilter: "bad",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/1`)
            .send({
                salary: "300000",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
    test("works for admin users", async function () {
        const resp = await request(app)
            .delete(`/jobs/1`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.body).toEqual({ deleted: 1 });
    });

    test("unauth for non-admin user", async function () {
        const resp = await request(app)
            .delete(`/jobs/2`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});
