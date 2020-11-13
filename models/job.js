const db = require('../db');
const ExpressError = require('../helpers/expressError');
const moment = require('moment');

class Job {
	constructor({ id, title, salary, equity, company_handle, date_posted }) {
		(this.id = id),
			(this.title = title),
			(this.salary = salary),
			(this.equity = equity),
			(this.company_handle = company_handle),
			(this.date_posted = moment(date_posted).format('MMM Do YY'));
	}

	/** find all jobs. */

	static async all(query) {
		let whereClause = [];
		let values = [];
		let finalQuery;

		if (query.search) {
			values.push(`%${query.search}%`);
			whereClause.push(`title ILIKE $${values.length}`);
		}

		if (query.min_salary) {
			values.push(+query.min_salary);
			whereClause.push(`salary >= $${values.length}`);
		}

		if (query.min_equity) {
			values.push(+query.min_equity);
			whereClause.push(`equity > $${values.length}`);
		}

		const where = `WHERE ${whereClause.join(' AND ')} ORDER BY title, salary desc, equity desc`;

		if (whereClause.length === 0) {
			finalQuery = `SELECT * FROM jobs ORDER BY title, salary`;
		} else {
			finalQuery = `SELECT * FROM jobs ${where}`;
		}

		const results = await db.query(finalQuery, values);

		return results.rows.map((j) => new Job(j));
	}

	/** get job by id. */

	static async get(id) {
		const results = await db.query(`SELECT * FROM jobs WHERE id = $1`, [ id ]);

		let job = results.rows[0];

		if (job === undefined) {
			throw new ExpressError(`No such job with id: ${id}`, 404);
		}

		job = new Job(job);

		const companyResults = await db.query('SELECT * FROM companies WHERE handle = $1', [ job.company_handle ]);

		job.company = companyResults.rows[0];

		return job;
	}

	static async create(data) {
		const result = await db.query(
			`INSERT INTO jobs (
            title,
            salary,
            equity,
            company_handle) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
			[ data.title, data.salary, data.equity, data.company_handle ]
		);

		return result.rows[0];
	}

	/** save updated information about a job. */

	static async save(query, values) {
		const result = await db.query(`${query}`, [ ...values ]);
		return result.rows[0];
	}

	static async delete(id) {
		const result = await db.query('DELETE FROM jobs WHERE id = $1 RETURNING *', [ id ]);

		if (result.rows.length === 0) {
			throw new ExpressError(`No job found with id: ${id}. Could not delete.`, 404);
		}

		return result.rows[0];
	}

	static async application(username, id, state) {
		const result = await db.query(
			`INSERT INTO applications (username, job_id, state) VALUES ($1,$2,$3) RETURNING *`,
			[ username, id, state ]
		);
		result.rows[0]['created_at'] = moment(result.rows[0]['created_at']).format('MMM Do YY');
		return result.rows[0];
	}
}

module.exports = Job;

// {
//     "title": "Accountant",
//     "salary": 50000,
//     "equity": 0.5,
//     "company_handle": "apple"
// }
