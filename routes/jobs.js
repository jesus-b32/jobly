"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureIsAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, companyHandle }
 *
 * Returns { id, title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post("/", ensureIsAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
        const errs = validator.errors.map(e => e.stack);
        throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET /  =>
 *   { jobs: [{ id, title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 * title: filter by job title. Like before, this should be a case-insensitive, matches-any-part-of-string search.
 * minSalary: filter to jobs with at least that salary.
 * hasEquity: if true, filter to jobs that provide a non-zero amount of equity.
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
    try {
        const query = req.query;

        if (query.minSalary) {
            query.minSalary = Number(query.minSalary);
        }

        if (query.hasEquity) {
            query.hasEquity = Boolean(query.hasEquity);
        }

        //check if filter fields entered are valid
        const validator = jsonschema.validate(query, jobSearchSchema);

        if (!validator.valid) {
            throw new BadRequestError('Invalid query parameter(s). Please try again');
        }

        const jobs = await Job.findAll(query);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, company }
 *   where company is { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: {title, salary, equity}
 *
 * Returns {id, title, salary, equity, companyHandle}
 *
 * Authorization required: admin
 */

router.patch("/:id", ensureIsAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const id = Number(req.params.id);
        const job = await Job.update(id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id", ensureIsAdmin, async function (req, res, next) {
    try {
        const id = Number(req.params.id)
        await Job.remove(id);
        return res.json({ deleted: id });
    } catch (err) {
        return next(err);
    }
});


module.exports = router;
