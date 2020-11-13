const ExpressError = require('../helpers/expressError');
const Company = require('../models/company');
const jsonschema = require('jsonschema');
const companySchema = require(__basedir + '/schema/companySchema.json');
const companyUpdateSchema = require(__basedir + '/schema/companyUpdateSchema.json');
const validator = require('validator');

async function checkForHandle(req, res, next) {
	try {
		if (!req.params) {
			throw new ExpressError('Missing parameters', 400);
		} else {
			const { handle } = req.params;
			const company = await Company.get(handle);

			if (!company) {
				throw new ExpressErorr(`No company exists with handle ${handle}`, 404);
			} else {
				res.locals.company = company;
				next();
			}
		}
	} catch (error) {
		return next(error);
	}
}

function validateSchema(req, res, next) {
	let result;

	if (req.method === 'PATCH') {
		result = jsonschema.validate(req.body, companyUpdateSchema);
	} else if (req.method === 'POST') {
		result = jsonschema.validate(req.body, companySchema);
	}

	let allErrors = [];

	if (!result.valid) {
		result.errors.map((error) => {
			allErrors.push(new ExpressError(error.stack, 400));
		});
	}

	if (req.body.logo_url) {
		if (!validator.isURL(req.body.logo_url)) {
			allErrors.push(new ExpressError('logo_url must be a valid URL', 400));
		}
	}

	if (allErrors.length !== 0) {
		return res.status(400).json({ errors: allErrors });
	} else {
		next();
	}
}

async function checkForQuery(req, res, next) {
	if (!req.query) {
		return next();
	}

	if (req.query.min_employees && req.query.max_employees) {
		if (+req.query.min_employees > +req.query.max_employees) {
			return res.status(400).json({
				error : new ExpressError('Incorrect parameters. max_employees must be larger than min_employees', 400)
			});
		}
	}

	next();
}

module.exports = { checkForHandle, validateSchema, checkForQuery };
