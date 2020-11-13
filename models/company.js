const db = require('../db');
const ExpressError = require('../helpers/expressError');
const moment = require('moment');

class Company {
	constructor({ handle, name, num_employees, description, logo_url }) {
		(this.handle = handle),
			(this.name = name),
			(this.num_employees = num_employees),
			(this.description = description),
			(this.logo_url = logo_url);
	}

	/** find all companies. */

	static async all(query) {
		let whereClause = [];
		let values = [];
		let finalQuery;

		if (query.search) {
			values.push(`%${query.search}%`);
			whereClause.push(`name ILIKE $${values.length}`);
		}

		if (query.min_employees) {
			values.push(+query.min_employees);
			whereClause.push(`num_employees >= $${values.length}`);
		}

		if (query.max_employees) {
			values.push(+query.max_employees);
			whereClause.push(`num_employees < $${values.length}`);
		}

		const where = `WHERE ${whereClause.join(' AND ')} ORDER BY name, num_employees`;

		if (whereClause.length === 0) {
			finalQuery = `SELECT * FROM companies ORDER BY name, num_employees`;
		} else {
			finalQuery = `SELECT * FROM companies ${where}`;
		}

		const results = await db.query(finalQuery, values);

		return results.rows.map((c) => new Company(c));
	}

	/** get company by handle. */

	static async get(handle) {
		const results = await db.query(`SELECT * FROM companies WHERE handle = $1`, [ handle ]);

		let company = results.rows[0];

		if (company === undefined) {
			throw new ExpressError(`No such company with handle: ${handle}`, 404);
		}

		company = new Company(company);

		const jobResults = await db.query(`SELECT * FROM jobs WHERE company_handle=$1`, [ company.handle ]);

		jobResults.rows.map((job) => {
			job.date_posted = moment(job.date_posted).format('MMM Do YY');
		});

		company.jobs = jobResults.rows;

		// return new Company(company);
		return company;
	}

	static async create(data) {
		const result = await db.query(
			`INSERT INTO companies (
            handle,
            name,
            num_employees,
            description,
            logo_url) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
			[ data.handle, data.name, data.num_employees, data.description, data.logo_url ]
		);

		return result.rows[0];
	}

	/** save updated information about a company. */

	static async save(query, values) {
		const result = await db.query(`${query}`, [ ...values ]);
		return result.rows[0];
	}

	/** Delete a company */

	static async delete(handle) {
		const result = await db.query('DELETE FROM companies WHERE handle = $1 RETURNING *', [ handle ]);

		if (result.rows.length === 0) {
			throw new ExpressError(`No company found with handle: ${handle}. Could not delete.`, 404);
		}

		return result.rows[0];
	}
}

module.exports = Company;

// {
//     "handle": "apple",
//     "name": "apple",
//     "num_employees": 5,
//     "description": "We do not sell apples. I know, confusing.",
//     "logo_url": "https://9to5mac.com/wp-content/uploads/sites/6/2018/02/logo.jpg?quality=82&strip=all"
// }

// {
//     "handle": "microsoft",
// 		"name" : "Microsoft",
//     "num_employees": 5000,
//     "description": "Owners of TikTok. We also make that one operating system.",
//     "logo_url": "https://wiki.videolan.org/images/Windows-logo.jpg"
// }
