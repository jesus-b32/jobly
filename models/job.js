"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { id, title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if job already in database.
   * */

    static async create(data) {
        const result = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
            data.title,
            data.salary,
            data.equity,
            data.companyHandle
            ]
        );
        const job = result.rows[0];

        return job;
    }

  /** Find all jobs.
   * OPtional Filters
   *    title (will find case-insensitive, partial matches)
   *    minSalary
   *    hasEquity (true returns only jobs with equity > 0; otherwise ignored)
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

    static async findAll(query = {}) {
        const { title, minSalary, hasEquity } = query;
        
        //base dbQuery. The optional filters will appended to the end of the db query
        let dbQuery = `SELECT id,
                        title,
                        salary,
                        equity,
                        company_handle AS "companyHandle"
                    FROM jobs`;

        //stores the query variable of filters that will be used in db.query
        let queryVar = [];
        //stores the db queries for the optional three filter
        let filters = [];

        if (title) {
            queryVar.push(`%${title}%`);
            filters.push(`title ILIKE $${queryVar.length}`);
        }

        if (minSalary) {
            queryVar.push(minSalary);
            filters.push(`salary >= $${queryVar.length}`);
        }

        if (hasEquity === true) {
            filters.push(`equity > 0`);
        }

        //create the entire filter db query if there are any filter
        if (filters.length > 0) {
            dbQuery += ' WHERE ' + filters.join(' AND ');
        }

        dbQuery += ' ORDER BY title';
        const jobsRes = await db.query(dbQuery, queryVar);
        return jobsRes.rows;
    }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity company }
   *    where company is { handle, name, description, numEmployees, logoUrl }
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job id found: ${id}`);

        const companyRes = await db.query(
            `SELECT handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"
            FROM companies
            WHERE handle = $1`,
            [job.companyHandle]);

        delete job.companyHandle;
        job.company = companyRes.rows[0];

        return job;
    }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, companyHandle}
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1); //id will be last variable num

        const querySql = `UPDATE jobs 
                        SET ${setCols} 
                        WHERE id = ${idVarIdx} 
                        RETURNING id, 
                                    title, 
                                    salary, 
                                    equity, 
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job id found: ${id}`);

        return job;
    }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

    static async remove(id) {
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No job id found: ${id}`);
    }
}


module.exports = Job;
