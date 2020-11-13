const ExpressError = require('../helpers/expressError');
const Job = require('../models/job');
const jsonschema = require('jsonschema');
const jobSchema = require(__basedir + '/schema/jobSchema.json');
const jobUpdateSchema = require(__basedir + '/schema/jobUpdateSchema.json');

async function checkForID(req, res, next) {
	try {
		if (!req.params) {
			throw new ExpressError('Missing parameters', 400);
		} else {
			const { id } = req.params;

			if (isNaN(Number(id))) {
				throw new ExpressError(`Job with id ${id} does not exist.`, 404);
			}

			const job = await Job.get(id);

			if (!job) {
				throw new ExpressError(`No job exists with id ${id}`, 404);
			} else {
				res.locals.job = job;
				next();
			}
		}
	} catch (error) {
		// console.error(error);
		return next(error);
	}
}

function validateSchema(req, res, next) {
	let result;

	if (req.method === 'PATCH') {
		result = jsonschema.validate(req.body, jobUpdateSchema);
	} else if (req.method === 'POST') {
		result = jsonschema.validate(req.body, jobSchema);
	}

	if (!result.valid) {
		return res.status(400).json({ errors: new ExpressError(result.errors.map((error) => error.stack, 400)) });
	}

	next();
}

async function checkForQuery(req, res, next) {
	if (!req.query) {
		return next();
	}

	let allErrors = [];

	if (req.query.min_salary) {
		if (+req.query.min_salary < 0) {
			allErrors.push(new ExpressError('Incorrect parameters. min_salary must be larger than 0', 400));
		}
	}

	if (req.query.min_equity) {
		if (+req.query.min_equity < 0 || +req.query.min_equity > 1.0) {
			allErrors.push(new ExpressError('Incorrect parameters. min_equity must be between 0 and 1', 400));
		}
	}

	if (allErrors.length > 0) {
		return res.status(400).json({ errors: allErrors });
	}

	next();
}

function checkForState(req, res, next) {
	if (!req.body.state) {
		throw new ExpressError(
			`Missing parameters. Expecting state with value of either: interested, applied, accepted, or rejected.`,
			400
		);
	} else {
		next();
	}
}

module.exports = { checkForID, validateSchema, checkForQuery, checkForState };
